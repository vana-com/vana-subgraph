import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  Schema,
  File,
  UserTotals,
  DataRegistryProof,
} from "../../../../../generated/schema";
import {
  updateSchemaIndependentCounts,
  decrementSchemaIndependentCounts,
} from "../../../../../src/lib/contract/shared/schema-updater";
import { getProofId } from "../../../../../src/lib/contract/shared/proof-handlers";
import { getUserTotalsIdSchemaIndependent } from "../../../../../src/lib/entity/usertotals/constants";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

function createMockSchema(schemaId: string): Schema {
  const schema = new Schema(schemaId);
  schema.name = "TestSchema";
  schema.dialect = "json";
  schema.definitionUrl = "https://example.com/schema.json";
  schema.independentContributionsCount = GraphBigInt.zero();
  schema.independentUniqueContributorsCount = GraphBigInt.zero();
  schema.createdAt = GraphBigInt.fromI32(1000);
  schema.createdAtBlock = GraphBigInt.fromI32(100);
  schema.createdTxHash = new Uint8Array(32);
  schema.save();
  return schema;
}

function createMockFile(fileId: string, schemaId: GraphBigInt): File {
  const file = new File(fileId);
  file.owner = "0x1234567890123456789012345678901234567890";
  file.url = "https://example.com/file.json";
  file.schemaId = schemaId;
  file.addedAtBlock = GraphBigInt.fromI32(200);
  file.addedAtTimestamp = GraphBigInt.fromI32(2000);
  file.transactionHash = new Uint8Array(32);
  file.save();
  return file;
}

describe("updateSchemaIndependentCounts", () => {
  test("increments counts when file has no proofs", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";

    createMockSchema(schemaId);
    createMockFile(fileId, GraphBigInt.fromString(schemaId));

    // ACT
    updateSchemaIndependentCounts(userId, schemaId, fileId);

    // ASSERT
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

    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "1",
    );
  });

  test("does not increment counts when file has proofs", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";

    createMockSchema(schemaId);
    createMockFile(fileId, GraphBigInt.fromString(schemaId));

    // Create a proof for the file (proof index 1)
    const proofId = getProofId(
      GraphBigInt.fromString(fileId),
      GraphBigInt.fromI32(1),
    );
    const proof = new DataRegistryProof(proofId);
    proof.epoch = "epoch-1";
    proof.fileId = GraphBigInt.fromString(fileId);
    proof.proofIndex = GraphBigInt.fromI32(1);
    proof.createdAt = GraphBigInt.fromI32(3000);
    proof.createdAtBlock = GraphBigInt.fromI32(300);
    proof.createdTxHash = new Uint8Array(32);
    proof.save();

    // ACT
    updateSchemaIndependentCounts(userId, schemaId, fileId);

    // ASSERT - counts should remain zero
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

  test("increments unique contributors correctly for multiple users", () => {
    // ARRANGE
    const schemaId = "1";
    const user1 = "0x1111111111111111111111111111111111111111";
    const user2 = "0x2222222222222222222222222222222222222222";
    const fileId1 = "123";
    const fileId2 = "456";

    createMockSchema(schemaId);
    createMockFile(fileId1, GraphBigInt.fromString(schemaId));
    createMockFile(fileId2, GraphBigInt.fromString(schemaId));

    // ACT - First user contributes one file
    updateSchemaIndependentCounts(user1, schemaId, fileId1);

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

    // ACT - Second user contributes one file
    updateSchemaIndependentCounts(user2, schemaId, fileId2);

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
  });

  test("does not increment unique contributors for same user multiple files", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";
    const fileId1 = "123";
    const fileId2 = "456";

    createMockSchema(schemaId);
    createMockFile(fileId1, GraphBigInt.fromString(schemaId));
    createMockFile(fileId2, GraphBigInt.fromString(schemaId));

    // ACT - User contributes first file
    updateSchemaIndependentCounts(userId, schemaId, fileId1);

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

    // ACT - Same user contributes second file
    updateSchemaIndependentCounts(userId, schemaId, fileId2);

    // ASSERT - Should have 2 contributions but still 1 unique contributor
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
  });

  test("returns early when schema does not exist", () => {
    // ARRANGE
    const schemaId = "999"; // Non-existent schema
    const userId = "0x1234567890123456789012345678901234567890";
    const fileId = "123";

    // ACT - Should not throw error
    updateSchemaIndependentCounts(userId, schemaId, fileId);

    // ASSERT - No entities should be created
    assert.entityCount("Schema", 0);
    assert.entityCount("UserTotals", 0);
  });
});

describe("decrementSchemaIndependentCounts", () => {
  test("decrements counts when user has contributions", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";

    const schema = createMockSchema(schemaId);
    schema.independentContributionsCount = GraphBigInt.fromI32(2);
    schema.independentUniqueContributorsCount = GraphBigInt.fromI32(1);
    schema.save();

    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    const userTotals = new UserTotals(userTotalsId);
    userTotals.fileContributionsCount = GraphBigInt.fromI32(2);
    userTotals.save();

    // ACT
    decrementSchemaIndependentCounts(userId, schemaId);

    // ASSERT
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
    ); // Should remain 1
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "1",
    );
  });

  test("decrements unique contributors when user's last contribution", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";

    const schema = createMockSchema(schemaId);
    schema.independentContributionsCount = GraphBigInt.fromI32(1);
    schema.independentUniqueContributorsCount = GraphBigInt.fromI32(1);
    schema.save();

    const userTotalsId = getUserTotalsIdSchemaIndependent(userId, schemaId);
    const userTotals = new UserTotals(userTotalsId);
    userTotals.fileContributionsCount = GraphBigInt.fromI32(1); // User's last contribution
    userTotals.save();

    // ACT
    decrementSchemaIndependentCounts(userId, schemaId);

    // ASSERT
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
    ); // Should decrement to 0
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "0",
    );
  });

  test("returns early when user has no contributions", () => {
    // ARRANGE
    const schemaId = "1";
    const userId = "0x1234567890123456789012345678901234567890";

    const schema = createMockSchema(schemaId);
    schema.independentContributionsCount = GraphBigInt.fromI32(5);
    schema.independentUniqueContributorsCount = GraphBigInt.fromI32(3);
    schema.save();

    // No UserTotals entity created for this user

    // ACT
    decrementSchemaIndependentCounts(userId, schemaId);

    // ASSERT - Schema counts should remain unchanged
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentContributionsCount",
      "5",
    );
    assert.fieldEquals(
      "Schema",
      schemaId,
      "independentUniqueContributorsCount",
      "3",
    );
  });

  test("returns early when schema does not exist", () => {
    // ARRANGE
    const schemaId = "999"; // Non-existent schema
    const userId = "0x1234567890123456789012345678901234567890";

    // ACT - Should not throw error
    decrementSchemaIndependentCounts(userId, schemaId);

    // ASSERT - No entities should be created
    assert.entityCount("Schema", 0);
    assert.entityCount("UserTotals", 0);
  });
});
