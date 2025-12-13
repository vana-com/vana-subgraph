import {
  Address,
  ethereum,
  BigInt as GraphBigInt,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  EntityCreated,
  EntityUpdated,
  EntityStatusUpdated,
  EntityMaxAPYUpdated,
  RewardsAdded,
  RewardsProcessed,
  ForfeitedRewardsReturned,
} from "../../../../../generated/VanaPoolEntityImplementation/VanaPoolEntityImplementation";
import {
  Staked,
  Unstaked,
  MinStakeUpdated,
  EntityStakeRegistered,
} from "../../../../../generated/VanaPoolStakingImplementation/VanaPoolStakingImplementation";

// VanaPoolEntity events
export function createEntityCreatedEvent(
  entityId: number,
  ownerAddress: string,
  name: string,
  maxAPY: GraphBigInt
): EntityCreated {
  const event = changetype<EntityCreated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(ownerAddress))
    ),
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
    new ethereum.EventParam(
      "maxAPY",
      ethereum.Value.fromUnsignedBigInt(maxAPY)
    ),
  ];

  return event;
}

export function createEntityUpdatedEvent(
  entityId: number,
  ownerAddress: string,
  name: string
): EntityUpdated {
  const event = changetype<EntityUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(ownerAddress))
    ),
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
  ];

  return event;
}

export function createEntityStatusUpdatedEvent(
  entityId: number,
  newStatus: number
): EntityStatusUpdated {
  const event = changetype<EntityStatusUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "newStatus",
      ethereum.Value.fromI32(<i32>newStatus)
    ),
  ];

  return event;
}

export function createEntityMaxAPYUpdatedEvent(
  entityId: number,
  newMaxAPY: GraphBigInt
): EntityMaxAPYUpdated {
  const event = changetype<EntityMaxAPYUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "newMaxAPY",
      ethereum.Value.fromUnsignedBigInt(newMaxAPY)
    ),
  ];

  return event;
}

export function createRewardsAddedEvent(
  entityId: number,
  amount: GraphBigInt
): RewardsAdded {
  const event = changetype<RewardsAdded>(newMockEvent());
  event.logIndex = GraphBigInt.fromI32(0);

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ];

  return event;
}

export function createRewardsProcessedEvent(
  entityId: number,
  distributedAmount: GraphBigInt
): RewardsProcessed {
  const event = changetype<RewardsProcessed>(newMockEvent());
  event.logIndex = GraphBigInt.fromI32(1);

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "distributedAmount",
      ethereum.Value.fromUnsignedBigInt(distributedAmount)
    ),
  ];

  return event;
}

export function createForfeitedRewardsReturnedEvent(
  entityId: number,
  amount: GraphBigInt
): ForfeitedRewardsReturned {
  const event = changetype<ForfeitedRewardsReturned>(newMockEvent());
  event.logIndex = GraphBigInt.fromI32(2);

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ];

  return event;
}

// VanaPoolStaking events
export function createStakedEvent(
  entityId: number,
  staker: string,
  amount: GraphBigInt,
  sharesIssued: GraphBigInt
): Staked {
  const event = changetype<Staked>(newMockEvent());
  event.logIndex = GraphBigInt.fromI32(0);

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "staker",
      ethereum.Value.fromAddress(Address.fromString(staker))
    ),
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
    new ethereum.EventParam(
      "sharesIssued",
      ethereum.Value.fromUnsignedBigInt(sharesIssued)
    ),
  ];

  return event;
}

export function createUnstakedEvent(
  entityId: number,
  staker: string,
  amount: GraphBigInt,
  sharesBurned: GraphBigInt
): Unstaked {
  const event = changetype<Unstaked>(newMockEvent());
  event.logIndex = GraphBigInt.fromI32(1);

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(<i32>entityId))
    ),
    new ethereum.EventParam(
      "staker",
      ethereum.Value.fromAddress(Address.fromString(staker))
    ),
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
    new ethereum.EventParam(
      "sharesBurned",
      ethereum.Value.fromUnsignedBigInt(sharesBurned)
    ),
  ];

  return event;
}

export function createMinStakeUpdatedEvent(
  newMinStake: GraphBigInt
): MinStakeUpdated {
  const event = changetype<MinStakeUpdated>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "newMinStake",
      ethereum.Value.fromUnsignedBigInt(newMinStake)
    ),
  ];

  return event;
}

export function createEntityStakeRegisteredEvent(
  entityId: i32,
  ownerAddress: string
): EntityStakeRegistered {
  const event = changetype<EntityStakeRegistered>(newMockEvent());

  event.parameters = [
    new ethereum.EventParam(
      "entityId",
      ethereum.Value.fromUnsignedBigInt(GraphBigInt.fromI32(entityId))
    ),
    new ethereum.EventParam(
      "ownerAddress",
      ethereum.Value.fromAddress(Address.fromString(ownerAddress))
    ),
  ];

  return event;
}
