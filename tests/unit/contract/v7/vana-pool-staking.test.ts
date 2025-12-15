import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt, Address } from "@graphprotocol/graph-ts";
import {
  handleEntityCreated,
  handleEntityUpdated,
  handleEntityStatusUpdated,
  handleEntityMaxAPYUpdated,
  handleRewardsAdded,
  handleRewardsProcessed,
  handleForfeitedRewardsReturned,
} from "../../../../src/lib/contract/v7/vana-pool-entity";
import {
  handleStaked,
  handleUnstaked,
  handleMinStakeUpdated,
  handleEntityStakeRegistered,
} from "../../../../src/lib/contract/v7/vana-pool-staking";
import {
  StakingEntity,
  Stake,
  StakingParams,
} from "../../../../generated/schema";
import {
  createEntityCreatedEvent,
  createEntityUpdatedEvent,
  createEntityStatusUpdatedEvent,
  createEntityMaxAPYUpdatedEvent,
  createRewardsAddedEvent,
  createRewardsProcessedEvent,
  createForfeitedRewardsReturnedEvent,
  createStakedEvent,
  createUnstakedEvent,
  createMinStakeUpdatedEvent,
  createEntityStakeRegisteredEvent,
} from "./utils/staking-events";

// Helper to create a staking entity for tests
function createTestStakingEntity(entityId: number): void {
  const ownerAddress = "0x1111111111111111111111111111111111111111";
  const event = createEntityCreatedEvent(
    entityId,
    ownerAddress,
    "Test Entity",
    GraphBigInt.fromI32(1000)
  );
  handleEntityCreated(event);
}

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("VanaPoolEntity - handleEntityCreated", () => {
  test("creates a new staking entity", () => {
    const entityId = 1;
    const ownerAddress = "0x1111111111111111111111111111111111111111";
    const name = "Test DLP";
    const maxAPY = GraphBigInt.fromI32(5000); // 50%

    const event = createEntityCreatedEvent(entityId, ownerAddress, name, maxAPY);
    handleEntityCreated(event);

    const entity = StakingEntity.load(entityId.toString());
    assert.assertNotNull(entity);
    assert.bytesEquals(entity!.owner, Address.fromString(ownerAddress));
    assert.stringEquals(entity!.name, name);
    assert.bigIntEquals(entity!.maxAPY, maxAPY);
    assert.bigIntEquals(entity!.status, GraphBigInt.fromI32(1)); // ACTIVE
    assert.bigIntEquals(entity!.lockedRewardPool, GraphBigInt.zero());
    assert.bigIntEquals(entity!.activeRewardPool, GraphBigInt.zero());
    assert.bigIntEquals(entity!.totalDistributedRewards, GraphBigInt.zero());
    assert.bigIntEquals(entity!.totalShares, GraphBigInt.zero());
  });
});

describe("VanaPoolEntity - handleEntityUpdated", () => {
  test("updates an existing staking entity", () => {
    createTestStakingEntity(1);

    const newOwner = "0x2222222222222222222222222222222222222222";
    const newName = "Updated Entity";

    const event = createEntityUpdatedEvent(1, newOwner, newName);
    handleEntityUpdated(event);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bytesEquals(entity!.owner, Address.fromString(newOwner));
    assert.stringEquals(entity!.name, newName);
  });

  test("handles update for non-existent entity gracefully", () => {
    const event = createEntityUpdatedEvent(
      999,
      "0x1111111111111111111111111111111111111111",
      "Non-existent"
    );
    handleEntityUpdated(event);

    // Should not create an entity
    assert.assertNull(StakingEntity.load("999"));
  });
});

describe("VanaPoolEntity - handleEntityStatusUpdated", () => {
  test("updates entity status to REMOVED", () => {
    createTestStakingEntity(1);

    const event = createEntityStatusUpdatedEvent(1, 2); // REMOVED = 2
    handleEntityStatusUpdated(event);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.status, GraphBigInt.fromI32(2));
  });
});

describe("VanaPoolEntity - handleEntityMaxAPYUpdated", () => {
  test("updates entity max APY", () => {
    createTestStakingEntity(1);

    const newMaxAPY = GraphBigInt.fromI32(7500); // 75%
    const event = createEntityMaxAPYUpdatedEvent(1, newMaxAPY);
    handleEntityMaxAPYUpdated(event);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.maxAPY, newMaxAPY);
  });
});

describe("VanaPoolEntity - handleRewardsAdded", () => {
  test("adds rewards to locked pool", () => {
    createTestStakingEntity(1);

    const amount = GraphBigInt.fromString("1000000000000000000"); // 1 ETH
    const event = createRewardsAddedEvent(1, amount);
    handleRewardsAdded(event);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.lockedRewardPool, amount);
  });
});

describe("VanaPoolEntity - handleRewardsProcessed", () => {
  test("moves rewards from locked to active pool and updates totalDistributedRewards", () => {
    createTestStakingEntity(1);

    // First add some rewards to locked pool
    const lockedAmount = GraphBigInt.fromString("1000000000000000000");
    const addEvent = createRewardsAddedEvent(1, lockedAmount);
    handleRewardsAdded(addEvent);

    // Then process some rewards
    const processedAmount = GraphBigInt.fromString("500000000000000000");
    const processEvent = createRewardsProcessedEvent(1, processedAmount);
    handleRewardsProcessed(processEvent);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(
      entity!.lockedRewardPool,
      lockedAmount.minus(processedAmount)
    );
    assert.bigIntEquals(entity!.activeRewardPool, processedAmount);
    assert.bigIntEquals(entity!.totalDistributedRewards, processedAmount);
  });

  test("accumulates totalDistributedRewards across multiple process events", () => {
    createTestStakingEntity(1);

    // Add rewards to locked pool
    const lockedAmount = GraphBigInt.fromString("1000000000000000000");
    const addEvent = createRewardsAddedEvent(1, lockedAmount);
    handleRewardsAdded(addEvent);

    // Process rewards in two batches
    const firstProcessed = GraphBigInt.fromString("300000000000000000");
    const processEvent1 = createRewardsProcessedEvent(1, firstProcessed);
    handleRewardsProcessed(processEvent1);

    const secondProcessed = GraphBigInt.fromString("400000000000000000");
    const processEvent2 = createRewardsProcessedEvent(1, secondProcessed);
    handleRewardsProcessed(processEvent2);

    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(
      entity!.totalDistributedRewards,
      firstProcessed.plus(secondProcessed)
    );
  });
});

describe("VanaPoolEntity - handleForfeitedRewardsReturned", () => {
  test("moves forfeited rewards from active to locked pool and decrements totalDistributedRewards", () => {
    createTestStakingEntity(1);

    // Setup: Add rewards and process them to active pool
    const initialAmount = GraphBigInt.fromString("1000000000000000000");
    const addEvent = createRewardsAddedEvent(1, initialAmount);
    handleRewardsAdded(addEvent);

    const processEvent = createRewardsProcessedEvent(1, initialAmount);
    handleRewardsProcessed(processEvent);

    // Verify active pool has the rewards and totalDistributedRewards is set
    let entity = StakingEntity.load("1");
    assert.bigIntEquals(entity!.activeRewardPool, initialAmount);
    assert.bigIntEquals(entity!.lockedRewardPool, GraphBigInt.zero());
    assert.bigIntEquals(entity!.totalDistributedRewards, initialAmount);

    // Now handle forfeited rewards
    const forfeitedAmount = GraphBigInt.fromString("200000000000000000");
    const forfeitEvent = createForfeitedRewardsReturnedEvent(1, forfeitedAmount);
    handleForfeitedRewardsReturned(forfeitEvent);

    entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(
      entity!.activeRewardPool,
      initialAmount.minus(forfeitedAmount)
    );
    assert.bigIntEquals(entity!.lockedRewardPool, forfeitedAmount);
    // totalDistributedRewards should be decremented by forfeited amount
    assert.bigIntEquals(
      entity!.totalDistributedRewards,
      initialAmount.minus(forfeitedAmount)
    );
  });
});

describe("VanaPoolStaking - handleStaked", () => {
  test("creates stake and updates entity pool", () => {
    createTestStakingEntity(1);

    const staker = "0x3333333333333333333333333333333333333333";
    const amount = GraphBigInt.fromString("1000000000000000000");
    const sharesIssued = GraphBigInt.fromString("1000000000000000000");

    const event = createStakedEvent(1, staker, amount, sharesIssued);
    handleStaked(event);

    // Check StakingEntity was updated
    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.totalShares, sharesIssued);
    assert.bigIntEquals(entity!.activeRewardPool, amount);

    // Check Stake was created
    const stakeId = staker.toLowerCase() + "-1";
    const stake = Stake.load(stakeId);
    assert.assertNotNull(stake);
    assert.bigIntEquals(stake!.shares, sharesIssued);
    assert.bigIntEquals(stake!.totalStaked, amount);
    assert.bigIntEquals(stake!.totalUnstaked, GraphBigInt.zero());
  });

  test("accumulates stakes for same staker", () => {
    createTestStakingEntity(1);

    const staker = "0x3333333333333333333333333333333333333333";
    const amount1 = GraphBigInt.fromString("1000000000000000000");
    const shares1 = GraphBigInt.fromString("1000000000000000000");

    const event1 = createStakedEvent(1, staker, amount1, shares1);
    handleStaked(event1);

    // Second stake
    const amount2 = GraphBigInt.fromString("500000000000000000");
    const shares2 = GraphBigInt.fromString("400000000000000000"); // Different ratio

    const event2 = createStakedEvent(1, staker, amount2, shares2);
    handleStaked(event2);

    // Check Stake was accumulated
    const stakeId = staker.toLowerCase() + "-1";
    const stake = Stake.load(stakeId);
    assert.assertNotNull(stake);
    assert.bigIntEquals(stake!.shares, shares1.plus(shares2));
    assert.bigIntEquals(stake!.totalStaked, amount1.plus(amount2));

    // Check entity totals
    const entity = StakingEntity.load("1");
    assert.bigIntEquals(entity!.totalShares, shares1.plus(shares2));
    assert.bigIntEquals(entity!.activeRewardPool, amount1.plus(amount2));
  });
});

describe("VanaPoolStaking - handleUnstaked", () => {
  test("reduces stake and updates entity pool", () => {
    createTestStakingEntity(1);

    const staker = "0x3333333333333333333333333333333333333333";
    const stakeAmount = GraphBigInt.fromString("1000000000000000000");
    const stakeShares = GraphBigInt.fromString("1000000000000000000");

    // First stake
    const stakeEvent = createStakedEvent(1, staker, stakeAmount, stakeShares);
    handleStaked(stakeEvent);

    // Then unstake part of it
    const unstakeAmount = GraphBigInt.fromString("400000000000000000");
    const unstakeShares = GraphBigInt.fromString("400000000000000000");

    const unstakeEvent = createUnstakedEvent(1, staker, unstakeAmount, unstakeShares);
    handleUnstaked(unstakeEvent);

    // Check StakingEntity was updated
    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.totalShares, stakeShares.minus(unstakeShares));
    assert.bigIntEquals(entity!.activeRewardPool, stakeAmount.minus(unstakeAmount));

    // Check Stake was updated
    const stakeId = staker.toLowerCase() + "-1";
    const stake = Stake.load(stakeId);
    assert.assertNotNull(stake);
    assert.bigIntEquals(stake!.shares, stakeShares.minus(unstakeShares));
    assert.bigIntEquals(stake!.totalUnstaked, unstakeAmount);
  });
});

describe("VanaPoolStaking - handleMinStakeUpdated", () => {
  test("creates or updates staking params", () => {
    const newMinStake = GraphBigInt.fromString("100000000000000000000"); // 100 VANA

    const event = createMinStakeUpdatedEvent(newMinStake);
    handleMinStakeUpdated(event);

    const params = StakingParams.load("staking-params");
    assert.assertNotNull(params);
    assert.bigIntEquals(params!.minStakeAmount, newMinStake);
  });
});

describe("VanaPoolStaking - handleEntityStakeRegistered", () => {
  test("logs entity stake registration for existing entity", () => {
    createTestStakingEntity(1);

    const ownerAddress = "0x1111111111111111111111111111111111111111";
    const event = createEntityStakeRegisteredEvent(1, ownerAddress);

    // Should not throw, just log
    handleEntityStakeRegistered(event);

    // Entity should still exist
    const entity = StakingEntity.load("1");
    assert.assertNotNull(entity);
  });
});

describe("Integration - Staking with Forfeited Rewards", () => {
  test("full unstake during bonding period flow", () => {
    createTestStakingEntity(1);

    const staker = "0x3333333333333333333333333333333333333333";

    // 1. Add and process rewards
    const rewardAmount = GraphBigInt.fromString("1000000000000000000");
    const addEvent = createRewardsAddedEvent(1, rewardAmount);
    handleRewardsAdded(addEvent);

    const processEvent = createRewardsProcessedEvent(1, rewardAmount);
    handleRewardsProcessed(processEvent);

    // Verify totalDistributedRewards after processing
    let entity = StakingEntity.load("1");
    assert.bigIntEquals(entity!.totalDistributedRewards, rewardAmount);

    // 2. User stakes
    const stakeAmount = GraphBigInt.fromString("500000000000000000");
    const stakeShares = GraphBigInt.fromString("500000000000000000");
    const stakeEvent = createStakedEvent(1, staker, stakeAmount, stakeShares);
    handleStaked(stakeEvent);

    // Entity should have: activeRewardPool = 1000 + 500 = 1500
    entity = StakingEntity.load("1");
    assert.bigIntEquals(
      entity!.activeRewardPool,
      rewardAmount.plus(stakeAmount)
    );

    // 3. User unstakes during bonding period
    // They only get vanaToReturn (principal), forfeited rewards go back
    const vanaToReturn = GraphBigInt.fromString("500000000000000000");
    const sharesBurned = GraphBigInt.fromString("500000000000000000");
    const unstakeEvent = createUnstakedEvent(1, staker, vanaToReturn, sharesBurned);
    handleUnstaked(unstakeEvent);

    // 4. Forfeited rewards are returned to locked pool
    const forfeitedAmount = GraphBigInt.fromString("100000000000000000");
    const forfeitEvent = createForfeitedRewardsReturnedEvent(1, forfeitedAmount);
    handleForfeitedRewardsReturned(forfeitEvent);

    // Final state check
    entity = StakingEntity.load("1");

    // activeRewardPool = 1500 - 500 (unstake vanaToReturn) - 100 (forfeited) = 900
    assert.bigIntEquals(
      entity!.activeRewardPool,
      rewardAmount.plus(stakeAmount).minus(vanaToReturn).minus(forfeitedAmount)
    );

    // lockedRewardPool = 100 (forfeited)
    assert.bigIntEquals(entity!.lockedRewardPool, forfeitedAmount);

    // totalShares = 0
    assert.bigIntEquals(entity!.totalShares, GraphBigInt.zero());

    // totalDistributedRewards = 1000 (processed) - 100 (forfeited) = 900
    assert.bigIntEquals(
      entity!.totalDistributedRewards,
      rewardAmount.minus(forfeitedAmount)
    );
  });
});

describe("Out-of-Order Event Processing - Staked before EntityCreated", () => {
  test("handleStaked creates placeholder entity when EntityCreated not yet processed", () => {
    // Simulate Staked event being processed BEFORE EntityCreated
    // This happens when both events are in the same transaction but from different contracts
    const entityId = 1;
    const staker = "0x3333333333333333333333333333333333333333";
    const amount = GraphBigInt.fromString("1000000000000000000");
    const sharesIssued = GraphBigInt.fromString("1000000000000000000");

    // Process Staked event first (without EntityCreated)
    const stakeEvent = createStakedEvent(entityId, staker, amount, sharesIssued);
    handleStaked(stakeEvent);

    // Verify placeholder entity was created
    const entity = StakingEntity.load(entityId.toString());
    assert.assertNotNull(entity);
    // Placeholder has zero address for owner and empty name
    assert.bytesEquals(
      entity!.owner,
      Address.fromString("0x0000000000000000000000000000000000000000")
    );
    assert.stringEquals(entity!.name, "");
    // But totalShares and activeRewardPool should be updated
    assert.bigIntEquals(entity!.totalShares, sharesIssued);
    assert.bigIntEquals(entity!.activeRewardPool, amount);
  });

  test("handleEntityCreated merges with existing placeholder entity", () => {
    const entityId = 1;
    const staker = "0x3333333333333333333333333333333333333333";
    const ownerAddress = "0x1111111111111111111111111111111111111111";
    const entityName = "Test DLP";
    const maxAPY = GraphBigInt.fromI32(5000);
    const stakeAmount = GraphBigInt.fromString("1000000000000000000");
    const sharesIssued = GraphBigInt.fromString("1000000000000000000");

    // Step 1: Process Staked event first (simulating out-of-order processing)
    const stakeEvent = createStakedEvent(entityId, staker, stakeAmount, sharesIssued);
    handleStaked(stakeEvent);

    // Verify placeholder was created with stake data
    let entity = StakingEntity.load(entityId.toString());
    assert.assertNotNull(entity);
    assert.bigIntEquals(entity!.totalShares, sharesIssued);
    assert.bigIntEquals(entity!.activeRewardPool, stakeAmount);

    // Step 2: Process EntityCreated event (should merge, not overwrite)
    const entityCreatedEvent = createEntityCreatedEvent(
      entityId,
      ownerAddress,
      entityName,
      maxAPY
    );
    handleEntityCreated(entityCreatedEvent);

    // Verify entity has proper owner and name from EntityCreated
    entity = StakingEntity.load(entityId.toString());
    assert.assertNotNull(entity);
    assert.bytesEquals(entity!.owner, Address.fromString(ownerAddress));
    assert.stringEquals(entity!.name, entityName);
    assert.bigIntEquals(entity!.maxAPY, maxAPY);

    // CRITICAL: Verify that totalShares and activeRewardPool were PRESERVED
    assert.bigIntEquals(entity!.totalShares, sharesIssued);
    assert.bigIntEquals(entity!.activeRewardPool, stakeAmount);
  });

  test("multiple Staked events before EntityCreated accumulate correctly", () => {
    const entityId = 1;
    const staker1 = "0x3333333333333333333333333333333333333333";
    const staker2 = "0x4444444444444444444444444444444444444444";
    const ownerAddress = "0x1111111111111111111111111111111111111111";

    const amount1 = GraphBigInt.fromString("1000000000000000000");
    const shares1 = GraphBigInt.fromString("1000000000000000000");
    const amount2 = GraphBigInt.fromString("500000000000000000");
    const shares2 = GraphBigInt.fromString("500000000000000000");

    // Process multiple Staked events before EntityCreated
    const stakeEvent1 = createStakedEvent(entityId, staker1, amount1, shares1);
    handleStaked(stakeEvent1);

    const stakeEvent2 = createStakedEvent(entityId, staker2, amount2, shares2);
    handleStaked(stakeEvent2);

    // Verify accumulated values
    let entity = StakingEntity.load(entityId.toString());
    assert.bigIntEquals(entity!.totalShares, shares1.plus(shares2));
    assert.bigIntEquals(entity!.activeRewardPool, amount1.plus(amount2));

    // Now process EntityCreated
    const entityCreatedEvent = createEntityCreatedEvent(
      entityId,
      ownerAddress,
      "Test DLP",
      GraphBigInt.fromI32(5000)
    );
    handleEntityCreated(entityCreatedEvent);

    // Verify accumulated values were preserved
    entity = StakingEntity.load(entityId.toString());
    assert.bytesEquals(entity!.owner, Address.fromString(ownerAddress));
    assert.bigIntEquals(entity!.totalShares, shares1.plus(shares2));
    assert.bigIntEquals(entity!.activeRewardPool, amount1.plus(amount2));

    // Verify individual stakes were created correctly
    const stake1Id = staker1.toLowerCase() + "-1";
    const stake1 = Stake.load(stake1Id);
    assert.assertNotNull(stake1);
    assert.bigIntEquals(stake1!.shares, shares1);

    const stake2Id = staker2.toLowerCase() + "-1";
    const stake2 = Stake.load(stake2Id);
    assert.assertNotNull(stake2);
    assert.bigIntEquals(stake2!.shares, shares2);
  });
});
