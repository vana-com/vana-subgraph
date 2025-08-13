import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  BigInt as GraphBigInt,
  ethereum,
  Address,
  Bytes,
} from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import {
  createFileFromEvent,
  logDataRegistryEvent,
} from "../../../../../src/lib/contract/shared/file-handlers";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("createFileFromEvent", () => {
  test("creates a File entity with all required fields", () => {
    // ARRANGE
    const fileId = "123";
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const url = "ipfs://QmTest123";
    const schemaId = GraphBigInt.fromI32(42);

    // Create mock block and transaction
    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // ACT
    const file = createFileFromEvent(
      fileId,
      ownerAddress,
      url,
      mockBlock,
      mockTransaction,
      schemaId,
    );

    // ASSERT
    assert.entityCount("File", 1);
    assert.fieldEquals("File", fileId, "id", fileId);
    assert.fieldEquals("File", fileId, "owner", ownerAddress);
    assert.fieldEquals("File", fileId, "url", url);
    assert.fieldEquals("File", fileId, "schemaId", schemaId.toString());
    assert.fieldEquals(
      "File",
      fileId,
      "addedAtBlock",
      mockBlock.number.toString(),
    );
    assert.fieldEquals(
      "File",
      fileId,
      "addedAtTimestamp",
      mockBlock.timestamp.toString(),
    );
    assert.fieldEquals(
      "File",
      fileId,
      "transactionHash",
      mockTransaction.hash.toHexString(),
    );

    // Check that User entity was created
    assert.entityCount("User", 1);
    assert.fieldEquals("User", ownerAddress, "id", ownerAddress);
  });

  test("creates a File entity with default schema ID", () => {
    // ARRANGE
    const fileId = "456";
    const ownerAddress = "0x2345678901234567890123456789012345678901";
    const url = "ipfs://QmTest456";

    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // ACT - don't provide schemaId, should use default
    const file = createFileFromEvent(
      fileId,
      ownerAddress,
      url,
      mockBlock,
      mockTransaction,
    );

    // ASSERT
    assert.entityCount("File", 1);
    assert.fieldEquals("File", fileId, "schemaId", "0"); // Default should be 0
  });
});

describe("logDataRegistryEvent", () => {
  test("logs event without throwing", () => {
    // This test ensures the logging function doesn't throw errors
    // In matchstick, we can't directly test log output, but we can ensure it doesn't crash

    // ARRANGE
    const eventName = "FileAdded";
    const transactionHash = "0xabcd1234";

    // ACT - this should not throw
    logDataRegistryEvent(eventName, transactionHash);

    // ASSERT - if we reach here, the function didn't throw
    assert.assertTrue(true);
  });
});
