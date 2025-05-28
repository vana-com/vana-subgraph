import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  EpochCreated,
  EpochDlpRewardAdded,
  EpochFinalized,
  EpochRewardAmountUpdated,
  EpochSizeUpdated,
} from "../../../../generated/VanaEpochImplementationV5/VanaEpochImplementationV5";
import { Epoch, EpochReference } from "../../../../generated/schema";
import { getOrCreateCurrentParams } from "../../entity/params";
import {
  EPOCH_REFERENCE_ID_CURRENT,
  saveCurrentEpochReference,
} from "../../entity/epoch";

export function handleEpochCreatedV5(event: EpochCreated): void {
  log.info("handleEpochCreatedV5: {}", [event.transaction.hash.toHexString()]);

  const epoch = new Epoch(event.params.epochId.toString());
  epoch.startBlock = event.params.startBlock;
  epoch.endBlock = event.params.endBlock;
  epoch.reward = event.params.rewardAmount;
  epoch.createdAt = event.block.timestamp;
  epoch.createdAtBlock = event.block.number;
  epoch.createdTxHash = event.transaction.hash;
  epoch.isFinalized = false;
  epoch.dlpIds = [];
  epoch.logIndex = event.logIndex;
  epoch.save();

  const currentEpochRef = saveCurrentEpochReference(epoch.id);
  if (!currentEpochRef) {
    log.error(
      "Failed to update current epoch reference to epoch '{}': no current epoch reference found",
      [epoch.id],
    );
    return;
  }

  // Update params with epoch size
  const params = getOrCreateCurrentParams();
  params.epochSize = event.params.endBlock.minus(event.params.startBlock);
  params.save();
}

export function handleEpochDlpRewardAddedV5(event: EpochDlpRewardAdded): void {
  log.info("handleEpochDlpRewardAddedV5: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const epoch = Epoch.load(event.params.epochId.toString());
  if (epoch) {
    const dlpIds = epoch.dlpIds;
    dlpIds.push(event.params.dlpId);
    epoch.dlpIds = dlpIds;
    epoch.save();
  }
}

export function handleEpochFinalizedV5(event: EpochFinalized): void {
  log.info("handleEpochFinalizedV5: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const epoch = Epoch.load(event.params.epochId.toString());
  if (epoch) {
    epoch.isFinalized = true;
    epoch.save();
  }
}

export function handleEpochSizeUpdatedV5(event: EpochSizeUpdated): void {
  log.info("handleEpochSizeUpdatedV5: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const params = getOrCreateCurrentParams();
  params.epochSize = event.params.newEpochSize;
  params.save();
}

export function handleEpochRewardAmountUpdatedV5(
  event: EpochRewardAmountUpdated,
): void {
  log.info("handleEpochRewardAmountUpdatedV5: {}", [
    event.transaction.hash.toHexString(),
  ]);

  // Load or create the Params entity
  const params = getOrCreateCurrentParams();

  // Update the epoch reward amount
  params.epochRewardAmount = event.params.newEpochRewardAmount;
  params.save();
}
