import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  handleEpochCreatedV5,
  handleEpochDlpRewardAddedV5,
  handleEpochFinalizedV5,
  handleEpochRewardAmountUpdatedV5,
  handleEpochSizeUpdatedV5,
} from "../../../../src/lib/contract/v5/vana-epoch";
import {
  createEpochCreatedEvent,
  createEpochFinalizedEvent,
  createEpochDlpRewardAddedEvent,
  createEpochSizeUpdatedEvent,
  createEpochRewardAmountUpdatedEvent,
} from "./utils/vana-epoch-events";
import { Epoch } from "../../../../generated/schema";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../../src/lib/entity/epoch";
import { getOrCreateCurrentParams } from "../../../../src/lib/entity/params";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("handleEpochCreatedV5", () => {
  test("creates a new Epoch entity with correct fields", () => {
    const epochId = 1;
    const startBlock = 1000;
    const endBlock = 2000;
    const rewardAmount = 1000000;

    const epochCreatedEvent = createEpochCreatedEvent(
      epochId,
      startBlock,
      endBlock,
      rewardAmount,
    );

    handleEpochCreatedV5(epochCreatedEvent);

    // Check that the Epoch entity was created
    assert.entityCount("Epoch", 1);

    // Check that all fields were set correctly
    assert.fieldEquals("Epoch", "1", "startBlock", startBlock.toString());
    assert.fieldEquals("Epoch", "1", "endBlock", endBlock.toString());
    assert.fieldEquals("Epoch", "1", "reward", rewardAmount.toString());
    assert.fieldEquals("Epoch", "1", "isFinalized", "false");
    assert.fieldEquals("Epoch", "1", "rewardDistributed", "false");
    assert.fieldEquals("Epoch", "1", "dlpIds", "[]"); // Verify empty dlpIds array on creation

    // Check that current epoch reference was updated
    assert.entityCount("EpochReference", 1);
    assert.fieldEquals(
      "EpochReference",
      EPOCH_REFERENCE_ID_CURRENT,
      "epoch",
      "1",
    );

    // Check that params were updated
    const params = getOrCreateCurrentParams();
    assert.fieldEquals(
      "Params",
      params.id,
      "epochSize",
      GraphBigInt.fromI32(endBlock - startBlock).toString(),
    );

    // Check event metadata
    assert.fieldEquals(
      "Epoch",
      "1",
      "createdAt",
      epochCreatedEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "Epoch",
      "1",
      "createdTxHash",
      epochCreatedEvent.transaction.hash.toHexString(),
    );
    assert.fieldEquals(
      "Epoch",
      "1",
      "createdAtBlock",
      epochCreatedEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "Epoch",
      "1",
      "logIndex",
      epochCreatedEvent.logIndex.toString(),
    );
  });
});

describe("handleEpochFinalizedV5", () => {
  test("updates an existing Epoch correctly", () => {
    // Create an epoch first via an event
    const epochId = 1;
    const startBlock = 1000;
    const endBlock = 2000;
    const rewardAmount = 1000000;

    const epochCreatedEvent = createEpochCreatedEvent(
      epochId,
      startBlock,
      endBlock,
      rewardAmount,
    );

    handleEpochCreatedV5(epochCreatedEvent);

    // Now finalize it
    const epochFinalizedEvent = createEpochFinalizedEvent(epochId);

    handleEpochFinalizedV5(epochFinalizedEvent);

    // Check that the epoch was updated
    const updatedEpoch = Epoch.load(epochId.toString());
    assert.assertTrue(updatedEpoch!.isFinalized);
  });
});

describe("handleEpochDlpRewardAddedV5", () => {
  test("adds first DLP ID to epoch's empty dlpIds array", () => {
    // Create an epoch first
    const epochId = 1;
    const startBlock = 1000;
    const endBlock = 2000;
    const rewardAmount = 1000000;
    const dlpId = GraphBigInt.fromI32(1);

    const epochCreatedEvent = createEpochCreatedEvent(
      epochId,
      startBlock,
      endBlock,
      rewardAmount,
    );

    handleEpochCreatedV5(epochCreatedEvent);

    // Verify dlpIds is empty initially
    assert.fieldEquals("Epoch", epochId.toString(), "dlpIds", "[]");

    // Now add DLP reward
    const epochDlpRewardAddedEvent = createEpochDlpRewardAddedEvent(
      epochId,
      dlpId.toI32(),
    );
    handleEpochDlpRewardAddedV5(epochDlpRewardAddedEvent);

    // Check that the DLP ID was added to the array
    assert.fieldEquals(
      "Epoch",
      epochId.toString(),
      "dlpIds",
      `[${dlpId.toString()}]`,
    );
  });

  test("adds multiple DLP IDs to epoch's dlpIds array", () => {
    // Create an epoch first
    const epochId = 1;
    const startBlock = 1000;
    const endBlock = 2000;
    const rewardAmount = 1000000;

    const epochCreatedEvent = createEpochCreatedEvent(
      epochId,
      startBlock,
      endBlock,
      rewardAmount,
    );

    handleEpochCreatedV5(epochCreatedEvent);

    // Verify dlpIds is empty initially
    assert.fieldEquals("Epoch", epochId.toString(), "dlpIds", "[]");

    // Add first DLP reward
    const dlpId1 = GraphBigInt.fromI32(1);
    const epochDlpRewardAddedEvent1 = createEpochDlpRewardAddedEvent(
      epochId,
      dlpId1.toI32(),
    );
    handleEpochDlpRewardAddedV5(epochDlpRewardAddedEvent1);

    // Check first DLP ID was added
    assert.fieldEquals(
      "Epoch",
      epochId.toString(),
      "dlpIds",
      `[${dlpId1.toString()}]`,
    );

    // Add second DLP reward
    const dlpId2 = GraphBigInt.fromI32(2);
    const epochDlpRewardAddedEvent2 = createEpochDlpRewardAddedEvent(
      epochId,
      dlpId2.toI32(),
    );
    handleEpochDlpRewardAddedV5(epochDlpRewardAddedEvent2);

    // Check both DLP IDs are present
    assert.fieldEquals(
      "Epoch",
      epochId.toString(),
      "dlpIds",
      `[${dlpId1.toString()}, ${dlpId2.toString()}]`,
    );
  });
});

test("Can create and finalize epoch", () => {
  clearStore();

  const epochId = 1;
  const startBlock = 100;
  const endBlock = 200;
  const rewardAmount = 1000;

  const epochCreatedEvent = createEpochCreatedEvent(
    epochId,
    startBlock,
    endBlock,
    rewardAmount,
  );
  handleEpochCreatedV5(epochCreatedEvent);

  assert.fieldEquals("Epoch", "1", "id", "1");
  assert.fieldEquals("Epoch", "1", "startBlock", "100");
  assert.fieldEquals("Epoch", "1", "endBlock", "200");
  assert.fieldEquals("Epoch", "1", "isFinalized", "false");
  assert.fieldEquals("Epoch", "1", "dlpIds", "[]");

  const epochFinalizedEvent = createEpochFinalizedEvent(epochId);
  handleEpochFinalizedV5(epochFinalizedEvent);

  assert.fieldEquals("Epoch", "1", "isFinalized", "true");
});

test("Can add DLP reward to epoch", () => {
  clearStore();

  const epochId = 1;
  const startBlock = 100;
  const endBlock = 200;
  const rewardAmount = 1000;
  const dlpId = 1;

  const epochCreatedEvent = createEpochCreatedEvent(
    epochId,
    startBlock,
    endBlock,
    rewardAmount,
  );
  handleEpochCreatedV5(epochCreatedEvent);

  // Verify dlpIds is empty initially
  assert.fieldEquals("Epoch", "1", "dlpIds", "[]");

  const epochDlpRewardAddedEvent = createEpochDlpRewardAddedEvent(
    epochId,
    dlpId,
  );
  handleEpochDlpRewardAddedV5(epochDlpRewardAddedEvent);

  const epoch = Epoch.load(GraphBigInt.fromI32(epochId).toString());
  assert.assertNotNull(epoch);
  assert.i32Equals(epoch!.dlpIds.length, 1);
  assert.fieldEquals("Epoch", "1", "dlpIds", "[1]");
});

describe("handleEpochSizeUpdatedV5", () => {
  test("updates the epoch size in params", () => {
    const newEpochSize = 1000;
    const event = createEpochSizeUpdatedEvent(newEpochSize);

    handleEpochSizeUpdatedV5(event);

    const params = getOrCreateCurrentParams();
    assert.fieldEquals(
      "Params",
      params.id,
      "epochSize",
      newEpochSize.toString(),
    );
  });
});

describe("handleEpochRewardAmountUpdatedV5", () => {
  test("updates the epoch reward amount in params", () => {
    const newRewardAmount = 1000000;
    const event = createEpochRewardAmountUpdatedEvent(newRewardAmount);

    handleEpochRewardAmountUpdatedV5(event);

    const params = getOrCreateCurrentParams();
    assert.fieldEquals(
      "Params",
      params.id,
      "epochRewardAmount",
      newRewardAmount.toString(),
    );
  });
});
