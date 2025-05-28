import { BigInt as GraphBigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  EpochCreated,
  EpochFinalized,
  EpochDlpRewardAdded,
  EpochSizeUpdated,
  EpochRewardAmountUpdated,
} from "../../../../../generated/VanaEpochImplementationV5/VanaEpochImplementationV5";

export function createEpochCreatedEvent(
  epochId: number,
  startBlock: number,
  endBlock: number,
  rewardAmount: number,
): EpochCreated {
  const event = changetype<EpochCreated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "epochId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>epochId)),
    ),
    new ethereum.EventParam(
      "startBlock",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>startBlock)),
    ),
    new ethereum.EventParam(
      "endBlock",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>endBlock)),
    ),
    new ethereum.EventParam(
      "rewardAmount",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>rewardAmount)),
    ),
  ];

  return event;
}

export function createEpochSizeUpdatedEvent(
  newEpochSize: number,
): EpochSizeUpdated {
  const event = changetype<EpochSizeUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "newEpochSize",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>newEpochSize)),
    ),
  ];

  return event;
}

export function createEpochRewardAmountUpdatedEvent(
  newRewardAmount: number,
): EpochRewardAmountUpdated {
  const event = changetype<EpochRewardAmountUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "newEpochRewardAmount",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>newRewardAmount),
      ),
    ),
  ];

  return event;
}

export function createEpochFinalizedEvent(epochId: number): EpochFinalized {
  const event = changetype<EpochFinalized>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "epochId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>epochId)),
    ),
  ];

  return event;
}

export function createEpochDlpRewardAddedEvent(
  epochId: number,
  dlpId: number,
): EpochDlpRewardAdded {
  const event = changetype<EpochDlpRewardAdded>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "epochId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>epochId)),
    ),
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
  ];

  return event;
}
