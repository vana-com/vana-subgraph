import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import { EpochDlpPerformancesSaved as EpochDlpPerformancesSavedEvent } from "../../../../generated/DLPPerformanceImplementationV5/DLPPerformanceImplementationV5";

import { Dlp, Epoch, DlpPerformance } from "../../../../generated/schema";
import { getOrCreateDlp, getOrCreateEpoch } from "../shared";

export function handleEpochDlpPerformancesSavedV5(
  event: EpochDlpPerformancesSavedEvent,
): void {
  log.info("Handling EpochDlpPerformancesSaved with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const epochId = event.params.epochId.toString();
  const dlpId = event.params.dlpId.toString();

  // Get or create epoch and dlp (handles race condition when events are processed out of order)
  const epoch = getOrCreateEpoch(epochId);
  const dlp = getOrCreateDlp(dlpId);

  // Create unique performance ID
  const performanceId = `${epochId}-${dlpId}`;

  // Load existing or create new performance entity
  let dlpPerformance = DlpPerformance.load(performanceId);
  if (dlpPerformance == null) {
    dlpPerformance = new DlpPerformance(performanceId);
  }
  dlpPerformance.dlp = dlp.id;
  dlpPerformance.epoch = epoch.id;
  dlpPerformance.tradingVolume = event.params.tradingVolume;
  dlpPerformance.uniqueContributors = event.params.uniqueContributors;
  dlpPerformance.dataAccessFees = event.params.dataAccessFees;
  dlpPerformance.createdAt = event.block.timestamp;
  dlpPerformance.createdTxHash = event.transaction.hash;
  dlpPerformance.createdAtBlock = event.block.number;

  dlpPerformance.save();

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
