import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import { Epoch, EpochReference } from "../../../../generated/schema";
import { EPOCH_REFERENCE_ID_CURRENT } from "./constants";
import { epochRanges } from "../../../mapping";

export function getCurrentEpochReference(): EpochReference | null {
  return EpochReference.load(EPOCH_REFERENCE_ID_CURRENT);
}

export function getOrCreateEpochReference(epochId: string): EpochReference {
  let epochReference = EpochReference.load(epochId);
  if (!epochReference) {
    epochReference = new EpochReference(epochId);
    epochReference.epoch = epochId;
    epochReference.save();
  }
  return epochReference;
}

export function saveCurrentEpochReference(newEpochId: string): EpochReference {
  const currentEpoch = getOrCreateEpochReference(EPOCH_REFERENCE_ID_CURRENT);
  currentEpoch.epoch = newEpochId;
  currentEpoch.save();
  return currentEpoch;
}

export function getEpochForBlock(blockNumber: GraphBigInt): string {
  const currentEpochRef = getCurrentEpochReference();
  if (!currentEpochRef || !currentEpochRef.epoch) {
    return getEpochFromRanges(blockNumber);
  }

  const currentEpoch = Epoch.load(currentEpochRef.epoch);
  if (!currentEpoch) {
    return getEpochFromRanges(blockNumber);
  }

  if (currentEpoch.endBlock.le(GraphBigInt.zero())) {
    return currentEpoch.id;
  }

  // If the current epoch is in the past, we need to use the next epoch
  if (blockNumber.gt(currentEpoch.endBlock)) {
    // Get the next epoch by incrementing the current epoch ID
    const nextEpochId = GraphBigInt.fromString(currentEpoch.id)
      .plus(GraphBigInt.fromI32(1))
      .toString();
    const nextEpoch = Epoch.load(nextEpochId);
    if (nextEpoch) {
      return nextEpoch.id;
    }
    // If the next epoch has not been created yet, return the nextEpochId
    return nextEpochId;
  }

  return currentEpoch.id;
}

function getEpochFromRanges(blockNumber: GraphBigInt): string {
  // @ts-ignore
  const blockNumberInt = Number.parseInt(blockNumber.toString());

  for (let i = 0; i < epochRanges.length; i++) {
    const range = epochRanges[i];
    if (
      blockNumberInt >= range.startBlock &&
      blockNumberInt <= range.endBlock
    ) {
      return i.toString();
    }
  }

  log.error("No current epoch reference found for block {}", [
    blockNumber.toString(),
  ]);

  return "-1";
}
