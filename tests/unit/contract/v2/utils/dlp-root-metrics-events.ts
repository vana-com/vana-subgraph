import { ethereum, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { EpochPerformanceRatingsSaved } from "../../../../../generated/DLPRootMetricsImplementationV2/DLPRootMetricsImplementationV2";
import { DlpEpochPerformanceRatingSaved } from "../../../../../generated/DLPRootMetricsImplementationV2/DLPRootMetricsImplementationV2";
import { RatingPercentagesUpdated } from "../../../../../generated/DLPRootMetricsImplementationV2/DLPRootMetricsImplementationV2";

export function createEpochPerformanceRatingSavedEvent(
  epochId: GraphBigInt,
  totalPerformanceRating: GraphBigInt,
  isFinalised: boolean,
): EpochPerformanceRatingsSaved {
  const mockEvent = newMockEvent();

  const event = new EpochPerformanceRatingsSaved(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt,
  );

  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("epochId", ethereum.Value.fromI32(epochId.toI32())),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "totalPerformanceRating",
      ethereum.Value.fromI32(totalPerformanceRating.toI32()),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "isFinalized",
      ethereum.Value.fromBoolean(isFinalised),
    ),
  );

  return event;
}

export function createDlpEpochPerformanceRatingSavedEvent(
  epochId: GraphBigInt,
  dlpId: GraphBigInt,
  performanceRating: GraphBigInt,
): DlpEpochPerformanceRatingSaved {
  const mockEvent = newMockEvent();

  const event = new DlpEpochPerformanceRatingSaved(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt,
  );

  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("epochId", ethereum.Value.fromI32(epochId.toI32())),
  );
  event.parameters.push(
    new ethereum.EventParam("dlpId", ethereum.Value.fromI32(dlpId.toI32())),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "performanceRating",
      ethereum.Value.fromI32(performanceRating.toI32()),
    ),
  );

  return event;
}

export function createRatingPercentagesUpdatedEvent(
  ratingType: GraphBigInt,
  percentage: GraphBigInt,
): RatingPercentagesUpdated {
  const mockEvent = newMockEvent();

  const event = new RatingPercentagesUpdated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt,
  );

  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam(
      "ratingType",
      ethereum.Value.fromI32(ratingType.toI32()),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "percentage",
      ethereum.Value.fromI32(percentage.toI32()),
    ),
  );

  return event;
}
