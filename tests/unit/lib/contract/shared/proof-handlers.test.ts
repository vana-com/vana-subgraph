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
  createDataRegistryProof,
  isFirstProofForFile,
  getProofId
} from "../../../../../src/lib/contract/shared/proof-handlers";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("createDataRegistryProof", () => {
  test("creates a DataRegistryProof entity with all required fields", () => {
    // ARRANGE
    const transactionHash = "0xabcd1234567890abcd1234567890abcd12345678";
    const epochId = "epoch-1";
    const fileId = GraphBigInt.fromI32(123);
    const proofIndex = GraphBigInt.fromI32(456);

    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // ACT
    const proof = createDataRegistryProof(
      epochId,
      fileId,
      proofIndex,
      mockBlock,
      mockTransaction,
    );

    // ASSERT
    const expectedProofId = getProofId(fileId, proofIndex);
    assert.entityCount("DataRegistryProof", 1);
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "id",
      expectedProofId,
    );
    assert.fieldEquals("DataRegistryProof", expectedProofId, "epoch", epochId);
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "file",
      fileId.toString(),
    );
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "proofIndex",
      proofIndex.toString(),
    );
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "createdAt",
      mockBlock.timestamp.toString(),
    );
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "createdAtBlock",
      mockBlock.number.toString(),
    );
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "createdTxHash",
      mockTransaction.hash.toHexString(),
    );
  });

  test("creates a DataRegistryProof entity with optional user and DLP", () => {
    // ARRANGE
    const transactionHash = "0xdef456789abcdef456789abcdef456789abcdef45";
    const epochId = "epoch-2";
    const fileId = GraphBigInt.fromI32(789);
    const proofIndex = GraphBigInt.fromI32(101);
    const userId = "0x1234567890123456789012345678901234567890";
    const dlpId = "dlp-123";

    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // ACT
    const proof = createDataRegistryProof(
      epochId,
      fileId,
      proofIndex,
      mockBlock,
      mockTransaction,
      userId,
      dlpId,
    );

    // ASSERT
    const expectedProofId = getProofId(fileId, proofIndex);
    assert.entityCount("DataRegistryProof", 1);
    assert.fieldEquals("DataRegistryProof", expectedProofId, "user", userId);
    assert.fieldEquals("DataRegistryProof", expectedProofId, "dlp", dlpId);
  });

  test("creates a DataRegistryProof entity with null optional fields", () => {
    // ARRANGE
    const transactionHash = "0x987654321098765432109876543210987654321";
    const epochId = "epoch-3";
    const fileId = GraphBigInt.fromI32(999);
    const proofIndex = GraphBigInt.fromI32(888);

    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // ACT
    const proof = createDataRegistryProof(
      epochId,
      fileId,
      proofIndex,
      mockBlock,
      mockTransaction,
      null,
      null,
    );

    // ASSERT
    const expectedProofId = getProofId(fileId, proofIndex);
    assert.entityCount("DataRegistryProof", 1);
    assert.fieldEquals(
      "DataRegistryProof",
      expectedProofId,
      "id",
      expectedProofId,
    );
    // Optional fields should not be set when null is passed
  });
});

describe("isFirstProofForFile", () => {
  test("returns true when no proof exists for the file", () => {
    // ARRANGE
    const fileId = GraphBigInt.fromI32(123);

    // ACT
    const isFirst = isFirstProofForFile(fileId);

    // ASSERT
    assert.assertTrue(isFirst);
  });

  test("returns false when a proof with index 1 exists for the file", () => {
    // ARRANGE
    const fileId = GraphBigInt.fromI32(123);
    const proofIndex = GraphBigInt.fromI32(1);
    const epochId = "epoch-1";

    const mockEvent = newMockEvent();
    const mockBlock = mockEvent.block;
    const mockTransaction = mockEvent.transaction;

    // Create a proof with index 1
    createDataRegistryProof(
      epochId,
      fileId,
      proofIndex,
      mockBlock,
      mockTransaction,
    );

    // ACT
    const isFirst = isFirstProofForFile(fileId);

    // ASSERT
    assert.assertFalse(isFirst);
  });
});

describe("getProofId", () => {
  test("generates correct composite proof ID", () => {
    // ARRANGE
    const fileId = GraphBigInt.fromI32(123);
    const proofIndex = GraphBigInt.fromI32(456);

    // ACT
    const proofId = getProofId(fileId, proofIndex);

    // ASSERT
    assert.stringEquals(proofId, "file-123-proof-456");
  });

  test("generates correct proof ID for index 1", () => {
    // ARRANGE
    const fileId = GraphBigInt.fromI32(999);
    const proofIndex = GraphBigInt.fromI32(1);

    // ACT
    const proofId = getProofId(fileId, proofIndex);

    // ASSERT
    assert.stringEquals(proofId, "file-999-proof-1");
  });
});
