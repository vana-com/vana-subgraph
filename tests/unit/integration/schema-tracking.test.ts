import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt, Address } from "@graphprotocol/graph-ts";
import { Schema, File } from "../../../generated/schema";
import { handleSchemaAdded } from "../../../src/lib/contract/v6/data-refiner-registry";
import { createFileFromEvent } from "../../../src/lib/contract/shared/file-handlers";
import { createDataRegistryProof } from "../../../src/lib/contract/shared/proof-handlers";
import { createSchemaAddedEvent } from "../contract/v6/utils/data-refiner-registry-events";
import { getUserTotalsIdSchemaIndependent } from "../../../src/lib/entity/usertotals/constants";
import { newMockEvent } from "matchstick-as/assembly/index";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

function createMockBlockAndTransaction(): { block: any; transaction: any } {
  const mockEvent = newMockEvent();
  return {
    block: mockEvent.block,
    transaction: mockEvent.transaction,
  };
}

describe("Schema Independent Tracking Integration", () => {
  test("file creation increments schema independent counts", () => {
    // ARRANGE - Create a schema first
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    // Verify schema was created with zero counts
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );

    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";
    const { block, transaction } = createMockBlockAndTransaction();

    // ACT - Create a file with the schema
    createFileFromEvent(
      fileId,
      userId,
      "https://example.com/file.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // ASSERT - Schema counts should be incremented
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "1",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "1",
    );

    // User-schema tracking should be created
    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "1",
    );
  });

  test("proof creation decrements schema independent counts", () => {
    // ARRANGE - Create schema and file first
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";
    const { block, transaction } = createMockBlockAndTransaction();

    // Create file to increment counts
    createFileFromEvent(
      fileId,
      userId,
      "https://example.com/file.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // Verify file incremented the counts
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "1",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "1",
    );

    // ACT - Create first proof for the file
    createDataRegistryProof(
      "0xabcd1234567890abcd1234567890abcd12345678",
      "epoch-1",
      GraphBigInt.fromString(fileId),
      GraphBigInt.fromI32(1), // First proof
      block,
      transaction,
      userId,
      "dlp-1",
    );

    // ASSERT - Schema counts should be decremented
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );

    // User-schema tracking should be decremented
    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "0",
    );
  });

  test("subsequent proofs do not affect schema counts", () => {
    // ARRANGE - Create schema and file, then add first proof
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";
    const { block, transaction } = createMockBlockAndTransaction();

    createFileFromEvent(
      fileId,
      userId,
      "https://example.com/file.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // Add first proof (this should decrement)
    createDataRegistryProof(
      "0xfirst1234567890abcd1234567890abcd12345678",
      "epoch-1",
      GraphBigInt.fromString(fileId),
      GraphBigInt.fromI32(1),
      block,
      transaction,
      userId,
      "dlp-1",
    );

    // Verify counts are decremented
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );

    // ACT - Add second proof for same file
    createDataRegistryProof(
      "0xsecond234567890abcd1234567890abcd12345678",
      "epoch-1",
      GraphBigInt.fromString(fileId),
      GraphBigInt.fromI32(2), // Second proof
      block,
      transaction,
      userId,
      "dlp-1",
    );

    // ASSERT - Counts should remain the same (not decremented again)
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );
  });

  test("multiple users contributing to same schema", () => {
    // ARRANGE - Create schema
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const user1 = "0x1111111111111111111111111111111111111111";
    const user2 = "0x2222222222222222222222222222222222222222";
    const { block, transaction } = createMockBlockAndTransaction();

    // ACT - User 1 creates file
    createFileFromEvent(
      "file1",
      user1,
      "https://example.com/file1.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // ASSERT - Should have 1 contribution and 1 unique contributor
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "1",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "1",
    );

    // ACT - User 2 creates file
    createFileFromEvent(
      "file2",
      user2,
      "https://example.com/file2.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // ASSERT - Should have 2 contributions and 2 unique contributors
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "2",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "2",
    );

    // ACT - User 1 creates another file
    createFileFromEvent(
      "file3",
      user1,
      "https://example.com/file3.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // ASSERT - Should have 3 contributions but still 2 unique contributors
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "3",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "2",
    );
  });

  test("partial proof conversion - some files remain independent", () => {
    // ARRANGE - Create schema and multiple files from same user
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const userId = "0x1234567890123456789012345678901234567890";
    const { block, transaction } = createMockBlockAndTransaction();

    // Create two files
    createFileFromEvent(
      "file1",
      userId,
      "https://example.com/file1.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    createFileFromEvent(
      "file2",
      userId,
      "https://example.com/file2.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // Verify both files count as independent
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "2",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "1",
    );

    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "2",
    );

    // ACT - Add proof only to first file
    createDataRegistryProof(
      "0xproof1234567890abcd1234567890abcd12345678",
      "epoch-1",
      GraphBigInt.fromString("file1"),
      GraphBigInt.fromI32(1),
      block,
      transaction,
      userId,
      "dlp-1",
    );

    // ASSERT - Only one file's contribution should be decremented
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "1",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "1",
    ); // User still has file2
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "1",
    );
  });

  test("file with zero schema ID does not affect counts", () => {
    // ARRANGE - Create schema
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const userId = "0x1234567890123456789012345678901234567890";
    const { block, transaction } = createMockBlockAndTransaction();

    // ACT - Create file with zero schema ID (default/no schema)
    createFileFromEvent(
      "file1",
      userId,
      "https://example.com/file1.json",
      block,
      transaction,
      GraphBigInt.zero(), // No schema
    );

    // ASSERT - Schema counts should remain zero
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );

    // No UserTotals should be created for schema tracking
    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.notInStore("UserTotals", userTotalsId);
  });

  test("file already with proof does not increment counts", () => {
    // ARRANGE - Create schema and file
    const schemaId = "1";
    const schemaAddedEvent = createSchemaAddedEvent(
      1,
      "Test Schema",
      "JSON",
      "https://example.com/schema.json",
    );
    handleSchemaAdded(schemaAddedEvent);

    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";
    const { block, transaction } = createMockBlockAndTransaction();

    // First create a proof for the file (before file creation)
    createDataRegistryProof(
      "0xearly1234567890abcd1234567890abcd12345678",
      "epoch-1",
      GraphBigInt.fromString(fileId),
      GraphBigInt.fromI32(1),
      block,
      transaction,
      userId,
      "dlp-1",
    );

    // ACT - Now create the file (this simulates files created after proofs already exist)
    createFileFromEvent(
      fileId,
      userId,
      "https://example.com/file.json",
      block,
      transaction,
      GraphBigInt.fromString(schemaId),
    );

    // ASSERT - Schema counts should remain zero since file already has proof
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "0",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "0",
    );

    // No UserTotals should be created for independent tracking
    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.notInStore("UserTotals", userTotalsId);
  });
});
