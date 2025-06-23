import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import { EpochDlpPerformancesSaved as EpochDlpPerformancesSavedEvent } from "../../../../generated/DLPPerformanceImplementationV5/DLPPerformanceImplementationV5";

import { Dlp, Epoch, DlpPerformance } from "../../../../generated/schema";

export function handleEpochDlpPerformancesSavedV5(
  event: EpochDlpPerformancesSavedEvent,
): void {
  log.info("Handling EpochDlpPerformancesSaved with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const epochId = event.params.epochId.toString();
  const dlpId = event.params.dlpId.toString();

  // Load the epoch and dlp
  const epoch = Epoch.load(epochId);
  const dlp = Dlp.load(dlpId);

  if (epoch == null) {
    log.error("Epoch not found for performance metrics: {}", [epochId]);
    return;
  }

  if (dlp == null) {
    log.error("DLP not found for performance metrics: {}", [dlpId]);
    return;
  }

  // Create unique performance ID
  const performanceId = `${epochId}-${dlpId}`;

  // Load existing or create new performance entity
  let dlpPerformance = DlpPerformance.load(performanceId);
  if (dlpPerformance == null) {
    dlpPerformance = new DlpPerformance(performanceId);
  }
  dlpPerformance.dlp = dlp.id;
  dlpPerformance.epoch = epoch.id;
  dlpPerformance.totalScore = event.params.performanceRating;
  dlpPerformance.tradingVolume = event.params.tradingVolume;
  // Preserve our incremental count if it's higher than the contract value
  const contractUniqueContributors = event.params.uniqueContributors;
  const currentUniqueContributors = dlpPerformance.uniqueContributors;
  dlpPerformance.uniqueContributors = currentUniqueContributors.gt(contractUniqueContributors) 
    ? currentUniqueContributors 
    : contractUniqueContributors;
  dlpPerformance.dataAccessFees = event.params.dataAccessFees;
  dlpPerformance.createdAt = event.block.timestamp;
  dlpPerformance.createdTxHash = event.transaction.hash;
  dlpPerformance.createdAtBlock = event.block.number;

  dlpPerformance.save();

  // Update the DLP's current performance rating
  dlp.performanceRating = event.params.performanceRating;
  dlp.save();

  // Update epoch's dlpIds array if this dlpId is not already included
  const epochDlpIds = epoch.dlpIds;
  let dlpIdFound = false;

  for (let i = 0; i < epochDlpIds.length; i++) {
    if (epochDlpIds[i].toString() == dlpId) {
      dlpIdFound = true;
      break;
    }
  }

  if (!dlpIdFound) {
    epochDlpIds.push(GraphBigInt.fromString(dlpId));
    epoch.dlpIds = epochDlpIds;
    epoch.save();
  }
}
