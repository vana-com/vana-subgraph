import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import { File } from "../../../../generated/schema";
import {
  getOrCreateUserTotals,
  getUserTotalsId,
  getUserTotalsIdDlp,
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
