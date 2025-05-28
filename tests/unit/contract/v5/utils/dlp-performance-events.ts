import { BigInt as GraphBigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { EpochDlpPerformancesSaved } from "../../../../../generated/DLPPerformanceImplementationV5/DLPPerformanceImplementationV5";
import { EpochFinalized } from "../../../../../generated/VanaEpochImplementationV5/VanaEpochImplementationV5";

export function createEpochDlpPerformancesSavedEvent(
  epochId: number,
  dlpId: number,
  performanceRating: number,
  tradingVolume: number,
  uniqueContributors: number,
  dataAccessFees: number,
): EpochDlpPerformancesSaved {
  const event = changetype<EpochDlpPerformancesSaved>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "epochId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>epochId)),
    ),
    new ethereum.EventParam(
      "dlpId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>dlpId)),
    ),
    new ethereum.EventParam(
      "performanceRating",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>performanceRating),
      ),
    ),
    new ethereum.EventParam(
      "tradingVolume",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>tradingVolume),
      ),
    ),
    new ethereum.EventParam(
      "uniqueContributors",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>uniqueContributors),
      ),
    ),
    new ethereum.EventParam(
      "dataAccessFees",
      ethereum.Value.fromUnsignedBigInt(
        GraphBigInt.fromI32(<i32>dataAccessFees),
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
