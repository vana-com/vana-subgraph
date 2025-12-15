import { BigInt as GraphBigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
  MinStakeUpdated,
  EntityStakeRegistered,
} from "../../../../generated/VanaPoolStakingImplementation/VanaPoolStakingImplementation";
import {
  StakingEntity,
  Stake,
  StakeEvent,
  StakingParams,
} from "../../../../generated/schema";

const STAKING_PARAMS_ID = "staking-params";

// Mirrored from IVanaPoolEntity.EntityStatus
enum EntityStatus {
  NONE = 0,
  ACTIVE = 1,
  REMOVED = 2,
}

/**
 * Get or create a StakingEntity. This handles the case where Staked events
 * from VanaPoolStakingImplementation are processed before EntityCreated events
 * from VanaPoolEntityImplementation within the same transaction (e.g., during createEntity).
 *
 * The placeholder entity will have default values that will be properly populated
 * when handleEntityCreated processes the EntityCreated event.
 */
export function getOrCreateStakingEntity(
  entityId: string,
  timestamp: GraphBigInt,
  blockNumber: GraphBigInt,
  txHash: Bytes,
): StakingEntity {
  let stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.warning(
      "Creating placeholder StakingEntity {} - EntityCreated event not yet processed",
      [entityId],
    );
    stakingEntity = new StakingEntity(entityId);
    // Set placeholder values - these will be updated by handleEntityCreated
    stakingEntity.owner = Bytes.fromHexString(
      "0x0000000000000000000000000000000000000000",
    );
    stakingEntity.name = "";
    stakingEntity.status = GraphBigInt.fromI32(EntityStatus.ACTIVE);
    stakingEntity.maxAPY = GraphBigInt.zero();
    stakingEntity.lockedRewardPool = GraphBigInt.zero();
    stakingEntity.activeRewardPool = GraphBigInt.zero();
    stakingEntity.totalDistributedRewards = GraphBigInt.zero();
    stakingEntity.totalShares = GraphBigInt.zero();
    stakingEntity.lastUpdate = timestamp;
    stakingEntity.createdAt = timestamp;
    stakingEntity.createdAtBlock = blockNumber;
    stakingEntity.createdTxHash = txHash;
    stakingEntity.save();
  }
  return stakingEntity;
}

function getOrCreateStakingParams(): StakingParams {
  let params = StakingParams.load(STAKING_PARAMS_ID);
  if (params == null) {
    params = new StakingParams(STAKING_PARAMS_ID);
    params.minStakeAmount = GraphBigInt.zero();
    params.bondingPeriod = GraphBigInt.zero();
    params.save();
  }
  return params;
}

function getOrCreateStake(
  staker: Bytes,
  entityId: string,
  timestamp: GraphBigInt,
  blockNumber: GraphBigInt,
): Stake {
  const stakeId = staker.toHexString() + "-" + entityId;
  let stake = Stake.load(stakeId);
  if (stake == null) {
    stake = new Stake(stakeId);
    stake.staker = staker;
    stake.entity = entityId;
    stake.shares = GraphBigInt.zero();
    stake.totalStaked = GraphBigInt.zero();
    stake.totalUnstaked = GraphBigInt.zero();
    stake.createdAt = timestamp;
    stake.createdAtBlock = blockNumber;
    stake.updatedAt = timestamp;
    stake.save();
  }
  return stake;
}

export function handleStaked(event: Staked): void {
  log.info("Handling Staked event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const staker = event.params.staker;
  const amount = event.params.amount;
  const sharesIssued = event.params.sharesIssued;

  // Get or create StakingEntity - handles case where Staked is processed before EntityCreated
  const stakingEntity = getOrCreateStakingEntity(
    entityId,
    event.block.timestamp,
    event.block.number,
    event.transaction.hash,
  );

  stakingEntity.totalShares = stakingEntity.totalShares.plus(sharesIssued);
  stakingEntity.activeRewardPool = stakingEntity.activeRewardPool.plus(amount);
  stakingEntity.lastUpdate = event.block.timestamp;
  stakingEntity.save();

  // Update or create Stake
  const stake = getOrCreateStake(
    staker,
    entityId,
    event.block.timestamp,
    event.block.number,
  );
  stake.shares = stake.shares.plus(sharesIssued);
  stake.totalStaked = stake.totalStaked.plus(amount);
  stake.updatedAt = event.block.timestamp;
  stake.save();

  // Create StakeEvent
  const stakeEventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const stakeEvent = new StakeEvent(stakeEventId);
  stakeEvent.eventType = "stake";
  stakeEvent.staker = staker;
  stakeEvent.entity = entityId;
  stakeEvent.amount = amount;
  stakeEvent.shares = sharesIssued;
  stakeEvent.blockNumber = event.block.number;
  stakeEvent.timestamp = event.block.timestamp;
  stakeEvent.txHash = event.transaction.hash;
  stakeEvent.save();
}

export function handleUnstaked(event: Unstaked): void {
  log.info("Handling Unstaked event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const entityId = event.params.entityId.toString();
  const staker = event.params.staker;
  const amount = event.params.amount; // vanaToReturn - the actual amount user receives
  const sharesBurned = event.params.sharesBurned;

  // Update StakingEntity
  // The contract deducts shareValue from activeRewardPool via updateEntityPool.
  // shareValue = vanaToReturn + forfeitedRewards
  // We handle this in two parts:
  // 1. Here: activeRewardPool -= vanaToReturn (amount from this event)
  // 2. In handleForfeitedRewardsReturned: activeRewardPool -= forfeitedRewards
  const stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.error("StakingEntity not found for Unstaked event: {}", [entityId]);
    return;
  }

  stakingEntity.totalShares = stakingEntity.totalShares.minus(sharesBurned);
  stakingEntity.activeRewardPool = stakingEntity.activeRewardPool.minus(amount);
  stakingEntity.lastUpdate = event.block.timestamp;
  stakingEntity.save();

  // Update Stake
  const stakeId = staker.toHexString() + "-" + entityId;
  const stake = Stake.load(stakeId);
  if (stake == null) {
    log.error("Stake not found for Unstaked event: {}", [stakeId]);
    return;
  }

  stake.shares = stake.shares.minus(sharesBurned);
  stake.totalUnstaked = stake.totalUnstaked.plus(amount);
  stake.updatedAt = event.block.timestamp;
  stake.save();

  // Create StakeEvent
  const stakeEventId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const stakeEvent = new StakeEvent(stakeEventId);
  stakeEvent.eventType = "unstake";
  stakeEvent.staker = staker;
  stakeEvent.entity = entityId;
  stakeEvent.amount = amount;
  stakeEvent.shares = sharesBurned;
  stakeEvent.blockNumber = event.block.number;
  stakeEvent.timestamp = event.block.timestamp;
  stakeEvent.txHash = event.transaction.hash;
  stakeEvent.save();
}

export function handleMinStakeUpdated(event: MinStakeUpdated): void {
  log.info("Handling MinStakeUpdated event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const params = getOrCreateStakingParams();
  params.minStakeAmount = event.params.newMinStake;
  params.save();
}

export function handleEntityStakeRegistered(
  event: EntityStakeRegistered,
): void {
  log.info("Handling EntityStakeRegistered event with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  // This event is emitted when an entity is created and the owner's registration stake is recorded
  // The StakingEntity should already exist from EntityCreated event
  // This handler can be used to track the initial stake registration if needed
  const entityId = event.params.entityId.toString();
  const ownerAddress = event.params.ownerAddress;

  const stakingEntity = StakingEntity.load(entityId);
  if (stakingEntity == null) {
    log.warning(
      "StakingEntity not found for EntityStakeRegistered event: {}. This is expected if EntityCreated hasn't been processed yet.",
      [entityId],
    );
    return;
  }

  log.info("EntityStakeRegistered processed for entity {} with owner {}", [
    entityId,
    ownerAddress.toHexString(),
  ]);
}
