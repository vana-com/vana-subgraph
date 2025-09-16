import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import { File } from "../../../../generated/schema";
import {
  getOrCreateUserTotals,
  getUserTotalsId,
  getUserTotalsIdDlp,
  getUserTotalsIdSchema,
  getOrCreateUserTotalsForGlobalSchema,
} from "../../entity/usertotals";
import {
  getOrCreateTotals,
  getTotalsDlpId,
  TOTALS_ID_GLOBAL,
} from "../../entity/totals";

/**
 * Updates global totals for file contributions
 * @param userId - The user ID who contributed
 */
export function updateGlobalTotals(userId: string): void {
  // Update user totals
  const userTotalsId = getUserTotalsId(userId);
  const userTotals = getOrCreateUserTotals(userTotalsId);
  userTotals.fileContributionsCount = userTotals.fileContributionsCount.plus(
    GraphBigInt.fromI32(1),
  );
  userTotals.save();

  // Update global file contribution totals
  const totals = getOrCreateTotals(TOTALS_ID_GLOBAL);
  totals.totalFileContributions = totals.totalFileContributions.plus(
    GraphBigInt.fromI32(1),
  );

  // If this is the user's first contribution, increment unique contributors
  if (userTotals.fileContributionsCount.toI32() === 1) {
    totals.uniqueFileContributors = totals.uniqueFileContributors.plus(
      GraphBigInt.fromI32(1),
    );
  }

  totals.save();
}

/**
 * Updates DLP-specific totals for file contributions
 * @param userId - The user ID who contributed
 * @param dlpId - The DLP ID
 */
export function updateDlpTotals(userId: string, dlpId: string): void {
  // Create or load DLP user totals
  const dlpUserTotalsId = getUserTotalsIdDlp(userId, dlpId);
  const dlpUserTotals = getOrCreateUserTotals(dlpUserTotalsId);
  dlpUserTotals.fileContributionsCount =
    dlpUserTotals.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  dlpUserTotals.save();

  // Update DLP file contribution totals
  const dlpTotalsId = getTotalsDlpId(dlpId);
  const dlpTotals = getOrCreateTotals(dlpTotalsId);
  dlpTotals.totalFileContributions = dlpTotals.totalFileContributions.plus(
    GraphBigInt.fromI32(1),
  );

  // If this is the user's first contribution to this DLP, increment unique contributors
  if (dlpUserTotals.fileContributionsCount.toI32() === 1) {
    dlpTotals.uniqueFileContributors = dlpTotals.uniqueFileContributors.plus(
      GraphBigInt.fromI32(1),
    );
  }

  dlpTotals.save();
}

/**
 * Updates both global and DLP totals for file contributions
 * @param userId - The user ID who contributed
 * @param dlpId - The DLP ID (optional, if not provided only global totals are updated)
 */
export function updateAllTotals(
  userId: string,
  dlpId: string | null = null,
): void {
  updateGlobalTotals(userId);

  if (dlpId) {
    updateDlpTotals(userId, dlpId);
  }
}

/**
 * Updates totals based on file owner (used in V1 where we need to get user from file)
 * @param fileId - The file ID to look up the owner
 * @param dlpId - Optional DLP ID
 */
export function updateTotalsFromFile(
  fileId: string,
  dlpId: string | null = null,
): void {
  const file = File.load(fileId);
  if (!file || !file.owner) {
    log.warning("Cannot update totals: file {} not found or has no owner", [
      fileId,
    ]);
    return;
  }

  updateAllTotals(file.owner, dlpId);
}

/**
 * Updates global totals for schema file contributions
 * @param userId - The user ID who contributed
 */
export function updateGlobalSchemaTotals(userId: string): void {
  // Get or create global schema user totals to track if user has contributed schema files before
  const userGlobalSchemaTotals = getOrCreateUserTotalsForGlobalSchema(userId);

  // Check if this is the user's first schema file contribution
  const isFirstSchemaContribution = userGlobalSchemaTotals.fileContributionsCount.equals(GraphBigInt.zero());

  // Increment user's global schema contribution count
  userGlobalSchemaTotals.fileContributionsCount = userGlobalSchemaTotals.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  userGlobalSchemaTotals.save();

  // Update global totals
  const totals = getOrCreateTotals(TOTALS_ID_GLOBAL);

  // Always increment totalFilesWithSchema
  totals.totalFilesWithSchema = totals.totalFilesWithSchema.plus(GraphBigInt.fromI32(1));

  // If this is the user's first schema contribution, increment unique contributors
  if (isFirstSchemaContribution) {
    totals.uniqueFileContributorsWithSchema = totals.uniqueFileContributorsWithSchema.plus(GraphBigInt.fromI32(1));
  }

  totals.save();

  log.info("Updated global schema totals for user {}: totalFilesWithSchema={}, uniqueContributorsWithSchema={}", [
    userId,
    totals.totalFilesWithSchema.toString(),
    totals.uniqueFileContributorsWithSchema.toString()
  ]);
}

/**
 * Updates DLP-specific totals for schema file contributions
 * @param userId - The user ID who contributed
 * @param dlpId - The DLP ID
 */
export function updateDlpSchemaTotals(userId: string, dlpId: string): void {
  // For DLP schema totals, we need to track per-DLP schema contributions
  // We can reuse the existing DLP user totals structure for this
  const dlpUserTotalsId = getUserTotalsIdDlp(userId, dlpId);

  // For DLP schema tracking, we'll use a separate UserTotals with schema suffix
  const dlpSchemaUserTotalsId = `${dlpUserTotalsId}-schema`;
  const dlpSchemaUserTotals = getOrCreateUserTotals(dlpSchemaUserTotalsId);

  // Check if this is the user's first schema contribution to this DLP
  const isFirstDlpSchemaContribution = dlpSchemaUserTotals.fileContributionsCount.equals(GraphBigInt.zero());

  // Increment user's DLP schema contribution count
  dlpSchemaUserTotals.fileContributionsCount = dlpSchemaUserTotals.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  dlpSchemaUserTotals.save();

  // Update DLP totals
  const dlpTotalsId = getTotalsDlpId(dlpId);
  const dlpTotals = getOrCreateTotals(dlpTotalsId);

  // Always increment totalFilesWithSchema for this DLP
  dlpTotals.totalFilesWithSchema = dlpTotals.totalFilesWithSchema.plus(GraphBigInt.fromI32(1));

  // If this is the user's first schema contribution to this DLP, increment unique contributors
  if (isFirstDlpSchemaContribution) {
    dlpTotals.uniqueFileContributorsWithSchema = dlpTotals.uniqueFileContributorsWithSchema.plus(GraphBigInt.fromI32(1));
  }

  dlpTotals.save();

  log.info("Updated DLP {} schema totals for user {}: totalFilesWithSchema={}, uniqueContributorsWithSchema={}", [
    dlpId,
    userId,
    dlpTotals.totalFilesWithSchema.toString(),
    dlpTotals.uniqueFileContributorsWithSchema.toString()
  ]);
}
