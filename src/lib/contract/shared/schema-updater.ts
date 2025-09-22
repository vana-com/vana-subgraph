import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Schema, DataRegistryProof } from "../../../../generated/schema";
import { getOrCreateUserTotalsForSchemaIndependent } from "../../entity/usertotals/user-totals";
import { getProofId } from "./proof-handlers";

/**
 * Updates schema independent contribution counts when a file is added
 * @param userId - The user ID
 * @param schemaId - The schema ID
 * @param fileId - The file ID
 */
export function updateSchemaIndependentCounts(
  userId: string,
  schemaId: string,
  fileId: string,
): void {
  // Check if this file has any proofs (meaning it's not independent)
  const fileIdBigInt = GraphBigInt.fromString(fileId);

  // Only count as independent if no proof exists
  if (hasFileAnyProof(fileIdBigInt)) {
    return;
  }

  const schema = Schema.load(schemaId);
  if (schema == null) {
    // Schema doesn't exist yet, this shouldn't happen normally
    return;
  }

  // Track user-schema contribution
  const userSchemaContribution = getOrCreateUserTotalsForSchemaIndependent(
    userId,
    schemaId,
  );

  // Check if this is the user's first contribution to this schema
  const isFirstContribution =
    userSchemaContribution.fileContributionsCount.isZero();

  // Update user-schema contribution count
  userSchemaContribution.fileContributionsCount =
    userSchemaContribution.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  userSchemaContribution.save();

  // Update schema independent contribution count
  schema.independentContributionsCount =
    schema.independentContributionsCount.plus(GraphBigInt.fromI32(1));

  // Update unique contributors count if this is user's first contribution to this schema
  if (isFirstContribution) {
    schema.independentUniqueContributorsCount =
      schema.independentUniqueContributorsCount.plus(GraphBigInt.fromI32(1));
  }

  schema.save();
}

/**
 * Helper function to check if a file has anydata proof
 * @param fileId - The file ID as BigInt
 * @returns true if any proof exists for this file
 */
function hasFileAnyProof(fileId: GraphBigInt): boolean {
  // Check if proof with index 1 exists (proofs are 1-indexed)
  const firstProofId = getProofId(fileId, GraphBigInt.fromI32(1));
  const firstProof = DataRegistryProof.load(firstProofId);
  return firstProof !== null;
}

/**
 * Decrements schema independent counts when a proof with DLP is added to a file
 * @param userId - The user ID
 * @param schemaId - The schema ID
 */
export function decrementSchemaIndependentCounts(
  userId: string,
  schemaId: string,
): void {
  const schema = Schema.load(schemaId);
  if (schema == null) {
    return;
  }

  const userSchemaContribution = getOrCreateUserTotalsForSchemaIndependent(
    userId,
    schemaId,
  );

  // Check if user had contributions to this schema
  if (userSchemaContribution.fileContributionsCount.isZero()) {
    return;
  }

  // Decrement the file count for this user-schema combination
  userSchemaContribution.fileContributionsCount =
    userSchemaContribution.fileContributionsCount.minus(GraphBigInt.fromI32(1));

  // If this was the user's last independent contribution to this schema
  if (userSchemaContribution.fileContributionsCount.isZero()) {
    schema.independentUniqueContributorsCount =
      schema.independentUniqueContributorsCount.minus(GraphBigInt.fromI32(1));
  }

  userSchemaContribution.save();

  // Decrement total independent contributions for this schema
  schema.independentContributionsCount =
    schema.independentContributionsCount.minus(GraphBigInt.fromI32(1));

  schema.save();
}
