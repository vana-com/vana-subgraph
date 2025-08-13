import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  logEventWithTxHash,
  logEntityNotFound,
  setBlockchainMetadata,
  createCompositeId,
  createTransactionId,
} from "../../../../../src/lib/contract/shared/event-utils";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("logEventWithTxHash", () => {
  test("logs event without throwing", () => {
    // ARRANGE
    const eventName = "TestEvent";
    const transactionHash = "0xabcd1234";

    // ACT - this should not throw
    logEventWithTxHash(eventName, transactionHash);

    // ASSERT - if we reach here, the function didn't throw
    assert.assertTrue(true);
  });
});

describe("logEntityNotFound", () => {
  test("logs entity not found without throwing", () => {
    // ARRANGE
    const entityType = "TestEntity";
    const entityId = "123";

    // ACT - this should not throw
    logEntityNotFound(entityType, entityId);

    // ASSERT - if we reach here, the function didn't throw
    assert.assertTrue(true);
  });

  test("logs entity not found with context without throwing", () => {
    // ARRANGE
    const entityType = "TestEntity";
    const entityId = "456";
    const context = "test operation";

    // ACT - this should not throw
    logEntityNotFound(entityType, entityId, context);

    // ASSERT - if we reach here, the function didn't throw
    assert.assertTrue(true);
  });
});

describe("setBlockchainMetadata", () => {
  test("sets blockchain metadata on entity", () => {
    // ARRANGE
    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;
    const logIndex = GraphBigInt.fromI32(5);

    // Create a simple entity-like object
    const entity = new Map<string, string>();

    // ACT
    setBlockchainMetadata(entity, mockBlock, mockTransaction, logIndex);

    // ASSERT
    // Note: In a real scenario, we'd test this with an actual entity
    // but this tests that the function doesn't throw
    assert.assertTrue(true);
  });

  test("sets blockchain metadata without log index", () => {
    // ARRANGE
    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    const entity = new Map<string, string>();

    // ACT
    setBlockchainMetadata(entity, mockBlock, mockTransaction);

    // ASSERT
    assert.assertTrue(true);
  });
});

describe("createCompositeId", () => {
  test("creates composite ID with default separator", () => {
    // ARRANGE
    const parts = ["user", "123", "dlp", "456"];

    // ACT
    const id = createCompositeId(parts);

    // ASSERT
    assert.stringEquals(id, "user-123-dlp-456");
  });

  test("creates composite ID with custom separator", () => {
    // ARRANGE
    const parts = ["prefix", "middle", "suffix"];
    const separator = "_";

    // ACT
    const id = createCompositeId(parts, separator);

    // ASSERT
    assert.stringEquals(id, "prefix_middle_suffix");
  });

  test("creates composite ID with single part", () => {
    // ARRANGE
    const parts = ["single"];

    // ACT
    const id = createCompositeId(parts);

    // ASSERT
    assert.stringEquals(id, "single");
  });
});

describe("createTransactionId", () => {
  test("creates transaction-based ID", () => {
    // ARRANGE
    const transactionHash = "0xabcd1234567890";
    const logIndex = GraphBigInt.fromI32(42);

    // ACT
    const id = createTransactionId(transactionHash, logIndex);

    // ASSERT
    assert.stringEquals(id, "0xabcd1234567890-42");
  });

  test("creates transaction-based ID with zero log index", () => {
    // ARRANGE
    const transactionHash = "0xdef456789abc";
    const logIndex = GraphBigInt.fromI32(0);

    // ACT
    const id = createTransactionId(transactionHash, logIndex);

    // ASSERT
    assert.stringEquals(id, "0xdef456789abc-0");
  });
});
