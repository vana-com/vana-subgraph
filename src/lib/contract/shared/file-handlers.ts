import { BigInt as GraphBigInt, log, ethereum } from "@graphprotocol/graph-ts";
import { File, Schema } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";
import { getOrCreateUserTotalsForSchema } from "../../entity/usertotals";
import {updateDlpSchemaTotals, updateGlobalSchemaTotals} from "./totals-updater";

/**
 * Creates a new File entity from a FileAdded event
 * @param fileId - The unique file ID
 * @param ownerAddress - The owner's address
 * @param url - The file URL
 * @param block - The block information
 * @param transaction - The transaction information
 * @param schemaId - The schema ID (defaults to 0 for versions that don't support it)
 * @returns The created File entity
 */
export function createFileFromEvent(
  fileId: string,
  ownerAddress: string,
  url: string,
  block: ethereum.Block,
  transaction: ethereum.Transaction,
  schemaId: GraphBigInt = GraphBigInt.fromI32(0),
): File {
  log.info("Creating file {} for owner {} with transaction hash: {}", [
    fileId,
    ownerAddress,
    transaction.hash.toHex(),
  ]);

  // Create user entity if it doesn't exist
  const user = getOrCreateUser(ownerAddress);

  // Create new File entity
  const file = new File(fileId);
  file.owner = user.id;
  file.url = url;
  file.addedAtBlock = block.number;
  file.addedAtTimestamp = block.timestamp;
  file.transactionHash = transaction.hash;
  file.schemaId = schemaId;

  file.save();

  // Track schema contributions if schemaId is not 0
  if (!schemaId.equals(GraphBigInt.zero())) {
    trackSchemaContribution(ownerAddress, schemaId.toString());
    // Update global schema totals
    updateGlobalSchemaTotals(ownerAddress);
  }

  return file;
}

/**
 * Updates DLP schema totals for a file with schema
 * @param fileId - The file ID
 * @param dlpId - The DLP ID
 */
export function updateDlpSchemaTotalsForFile(fileId: string, dlpId: string): void {
  const file = File.load(fileId);
  if (!file) {
    log.warning("Cannot update DLP schema totals: file {} not found", [fileId]);
    return;
  }

  // Only update if file has a schema (schemaId != 0)
  if (!file.schemaId.equals(GraphBigInt.zero()) && file.owner) {
    updateDlpSchemaTotals(file.owner, dlpId);

    log.info("Updated DLP {} schema totals for file {} with schema {}", [
      dlpId,
      fileId,
      file.schemaId.toString()
    ]);
  }
}

/**
 * Tracks schema contributions for a user and updates schema statistics
 * @param userId - The user ID
 * @param schemaId - The schema ID
 */
function trackSchemaContribution(userId: string, schemaId: string): void {
  // Get or create user totals for this schema
  const userSchemaTotal = getOrCreateUserTotalsForSchema(userId, schemaId);

  // Check if this is the user's first contribution to this schema
  const isFirstContribution = userSchemaTotal.fileContributionsCount.equals(GraphBigInt.zero());

  // Increment user's contribution count for this schema
  userSchemaTotal.fileContributionsCount = userSchemaTotal.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  userSchemaTotal.save();

  // Update schema entity
  let schema = Schema.load(schemaId);
  if (schema != null) {
    // Always increment contributionsCount
    schema.contributionsCount = schema.contributionsCount.plus(GraphBigInt.fromI32(1));

    // Increment uniqueContributorsCount if this is user's first contribution to this schema
    if (isFirstContribution) {
      schema.uniqueContributorsCount = schema.uniqueContributorsCount.plus(GraphBigInt.fromI32(1));
    }

    schema.save();

    log.info("Updated schema {} contributions: total={}, unique={}", [
      schemaId,
      schema.contributionsCount.toString(),
      schema.uniqueContributorsCount.toString()
    ]);
  }
}

/**
 * Standard logging format for DataRegistry events
 * @param eventName - The name of the event being handled
 * @param transactionHash - The transaction hash
 */
export function logDataRegistryEvent(
  eventName: string,
  transactionHash: string,
): void {
  log.info("Handling DataRegistry {} with transaction hash: {}", [
    eventName,
    transactionHash,
  ]);
}
