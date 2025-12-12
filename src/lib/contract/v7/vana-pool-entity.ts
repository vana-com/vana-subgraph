import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";
import {
  EntityCreated,
  EntityUpdated,
  EntityStatusUpdated,
  EntityMaxAPYUpdated,
  RewardsAdded,
  RewardsProcessed,
  ForfeitedRewardsReturned,
} from "../../../../generated/VanaPoolEntityImplementation/VanaPoolEntityImplementation";
import { StakingEntity, RewardEvent } from "../../../../generated/schema";

// Mirrored from IVanaPoolEntity.EntityStatus
enum EntityStatus {
  NONE = 0,
  ACTIVE = 1,
  REMOVED = 2,
}

export function handleEntityCreated(event: EntityCreated): void {
  log.info("Handling EntityCreated event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();

  const stakingEntity = new StakingEntity(entityId);
  stakingEntity.owner = event.params.ownerAddress;
  stakingEntity.name = event.params.name;
  stakingEntity.status = GraphBigInt.fromI32(EntityStatus.ACTIVE);
  stakingEntity.maxAPY = event.params.maxAPY;
  stakingEntity.lockedRewardPool = GraphBigInt.zero();
  stakingEntity.activeRewardPool = GraphBigInt.zero();
  stakingEntity.totalShares = GraphBigInt.zero();
  stakingEntity.lastUpdate = event.block.timestamp;
  stakingEntity.createdAt = event.block.timestamp;
  stakingEntity.createdAtBlock = event.block.number;
  stakingEntity.createdTxHash = event.transaction.hash;
  stakingEntity.save();
}

export function handleEntityUpdated(event: EntityUpdated): void {
  log.info("Handling EntityUpdated event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const stakingEntity = StakingEntity.load(entityId);

  if (stakingEntity == null) {
    log.error("StakingEntity not found for EntityUpdated event: {}", [
      entityId,
    ]);
    return;
  }

  stakingEntity.owner = event.params.ownerAddress;
  stakingEntity.name = event.params.name;
  stakingEntity.save();
}

export function handleEntityStatusUpdated(event: EntityStatusUpdated): void {
  log.info("Handling EntityStatusUpdated event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const stakingEntity = StakingEntity.load(entityId);

  if (stakingEntity == null) {
    log.error("StakingEntity not found for EntityStatusUpdated event: {}", [
      entityId,
    ]);
    return;
  }

  stakingEntity.status = GraphBigInt.fromI32(event.params.newStatus);
  stakingEntity.save();
}

export function handleEntityMaxAPYUpdated(event: EntityMaxAPYUpdated): void {
  log.info("Handling EntityMaxAPYUpdated event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const stakingEntity = StakingEntity.load(entityId);

  if (stakingEntity == null) {
    log.error("StakingEntity not found for EntityMaxAPYUpdated event: {}", [
      entityId,
    ]);
    return;
  }

  stakingEntity.maxAPY = event.params.newMaxAPY;
  stakingEntity.save();
}

export function handleRewardsAdded(event: RewardsAdded): void {
  log.info("Handling RewardsAdded event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const amount = event.params.amount;

  const stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.error("StakingEntity not found for RewardsAdded event: {}", [entityId]);
    return;
  }

  stakingEntity.lockedRewardPool = stakingEntity.lockedRewardPool.plus(amount);
  stakingEntity.save();

  // Create RewardEvent
  const rewardEventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const rewardEvent = new RewardEvent(rewardEventId);
  rewardEvent.eventType = "added";
  rewardEvent.entity = entityId;
  rewardEvent.amount = amount;
  rewardEvent.blockNumber = event.block.number;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.txHash = event.transaction.hash;
  rewardEvent.save();
}

export function handleRewardsProcessed(event: RewardsProcessed): void {
  log.info("Handling RewardsProcessed event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const distributedAmount = event.params.distributedAmount;

  const stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.error("StakingEntity not found for RewardsProcessed event: {}", [
      entityId,
    ]);
    return;
  }

  // Move rewards from locked to active pool
  stakingEntity.lockedRewardPool =
    stakingEntity.lockedRewardPool.minus(distributedAmount);
  stakingEntity.activeRewardPool =
    stakingEntity.activeRewardPool.plus(distributedAmount);
  stakingEntity.lastUpdate = event.block.timestamp;
  stakingEntity.save();

  // Create RewardEvent
  const rewardEventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const rewardEvent = new RewardEvent(rewardEventId);
  rewardEvent.eventType = "processed";
  rewardEvent.entity = entityId;
  rewardEvent.amount = distributedAmount;
  rewardEvent.blockNumber = event.block.number;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.txHash = event.transaction.hash;
  rewardEvent.save();
}

export function handleForfeitedRewardsReturned(
  event: ForfeitedRewardsReturned,
): void {
  log.info(
    "Handling ForfeitedRewardsReturned event with transaction hash: {}",
    [event.transaction.hash.toHexString()],
  );

  const entityId = event.params.entityId.toString();
  const amount = event.params.amount;

  const stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.error(
      "StakingEntity not found for ForfeitedRewardsReturned event: {}",
      [entityId],
    );
    return;
  }

  // When a user unstakes during bonding period, they only receive their principal (vanaToReturn).
  // The contract deducts the full shareValue from activeRewardPool via updateEntityPool.
  // The forfeited portion (shareValue - vanaToReturn) is then added back to lockedRewardPool.
  // In handleUnstaked, we deducted vanaToReturn from activeRewardPool.
  // Here we deduct the remaining forfeitedRewards from activeRewardPool and add to lockedRewardPool.
  stakingEntity.activeRewardPool = stakingEntity.activeRewardPool.minus(amount);
  stakingEntity.lockedRewardPool = stakingEntity.lockedRewardPool.plus(amount);
  stakingEntity.save();

  // Create RewardEvent
  const rewardEventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const rewardEvent = new RewardEvent(rewardEventId);
  rewardEvent.eventType = "forfeited";
  rewardEvent.entity = entityId;
  rewardEvent.amount = amount;
  rewardEvent.blockNumber = event.block.number;
  rewardEvent.timestamp = event.block.timestamp;
  rewardEvent.txHash = event.transaction.hash;
  rewardEvent.save();
}
