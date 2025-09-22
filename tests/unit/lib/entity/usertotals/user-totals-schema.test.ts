import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { UserTotals } from "../../../../../generated/schema";
import {
  getOrCreateUserTotalsForSchemaIndependent,
  getOrCreateUserTotals,
} from "../../../../../src/lib/entity/usertotals/user-totals";
import {
  getUserTotalsIdSchemaIndependent,
  getUserTotalsId,
} from "../../../../../src/lib/entity/usertotals/constants";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("getUserTotalsIdSchemaIndependent", () => {
  test("generates correct ID format", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const schemaId = "42";

    // ACT
    const id = getUserTotalsIdSchemaIndependent(userId, schemaId);

    // ASSERT
    assert.stringEquals(
      id,
      "user-0x1234567890123456789012345678901234567890-schema-42-independent",
    );
  });

  test("handles different user and schema combinations", () => {
    // Test multiple combinations
    const combinations = [
      {
        userId: "0xabc",
        schemaId: "1",
        expected: "user-0xabc-schema-1-independent",
      },
      {
        userId: "0x1234",
        schemaId: "999",
        expected: "user-0x1234-schema-999-independent",
      },
      {
        userId: "user123",
        schemaId: "schema456",
        expected: "user-user123-schema-schema456-independent",
      },
    ];

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      const id = getUserTotalsIdSchemaIndependent(combo.userId, combo.schemaId);
      assert.stringEquals(id, combo.expected);
    }
  });
});

describe("getOrCreateUserTotalsForSchemaIndependent", () => {
  test("creates new UserTotals entity when none exists", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const schemaId = "42";
    const expectedId = getUserTotalsIdSchemaIndependent(userId, schemaId);

    // Verify entity doesn't exist initially
    assert.notInStore("UserTotals", expectedId);

    // ACT
    const userTotals = getOrCreateUserTotalsForSchemaIndependent(
      userId,
      schemaId,
    );

    // ASSERT
    assert.stringEquals(userTotals.id, expectedId);
    assert.bigIntEquals(userTotals.fileContributionsCount, GraphBigInt.zero());

    // Verify entity was saved to store
    assert.fieldEquals("UserTotals", expectedId, "id", expectedId);
    assert.fieldEquals("UserTotals", expectedId, "fileContributionsCount", "0");
  });

  test("returns existing UserTotals entity when it exists", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const schemaId = "42";
    const expectedId = getUserTotalsIdSchemaIndependent(userId, schemaId);

    // Pre-create the entity with some data
    const existingUserTotals = new UserTotals(expectedId);
    existingUserTotals.fileContributionsCount = GraphBigInt.fromI32(5);
    existingUserTotals.save();

    // ACT
    const userTotals = getOrCreateUserTotalsForSchemaIndependent(
      userId,
      schemaId,
    );

    // ASSERT
    assert.stringEquals(userTotals.id, expectedId);
    assert.bigIntEquals(
      userTotals.fileContributionsCount,
      GraphBigInt.fromI32(5),
    );

    // Verify only one entity exists
    assert.entityCount("UserTotals", 1);
  });

  test("creates separate entities for different user-schema combinations", () => {
    // ARRANGE
    const user1 = "0x1111111111111111111111111111111111111111";
    const user2 = "0x2222222222222222222222222222222222222222";
    const schema1 = "1";
    const schema2 = "2";

    // ACT - Create multiple combinations
    const userTotals1_1 = getOrCreateUserTotalsForSchemaIndependent(
      user1,
      schema1,
    );
    const userTotals1_2 = getOrCreateUserTotalsForSchemaIndependent(
      user1,
      schema2,
    );
    const userTotals2_1 = getOrCreateUserTotalsForSchemaIndependent(
      user2,
      schema1,
    );
    const userTotals2_2 = getOrCreateUserTotalsForSchemaIndependent(
      user2,
      schema2,
    );

    // ASSERT - All should have different IDs
    assert.stringEquals(
      userTotals1_1.id,
      "user-0x1111111111111111111111111111111111111111-schema-1-independent",
    );
    assert.stringEquals(
      userTotals1_2.id,
      "user-0x1111111111111111111111111111111111111111-schema-2-independent",
    );
    assert.stringEquals(
      userTotals2_1.id,
      "user-0x2222222222222222222222222222222222222222-schema-1-independent",
    );
    assert.stringEquals(
      userTotals2_2.id,
      "user-0x2222222222222222222222222222222222222222-schema-2-independent",
    );

    // All should be initialized to zero
    assert.bigIntEquals(
      userTotals1_1.fileContributionsCount,
      GraphBigInt.zero(),
    );
    assert.bigIntEquals(
      userTotals1_2.fileContributionsCount,
      GraphBigInt.zero(),
    );
    assert.bigIntEquals(
      userTotals2_1.fileContributionsCount,
      GraphBigInt.zero(),
    );
    assert.bigIntEquals(
      userTotals2_2.fileContributionsCount,
      GraphBigInt.zero(),
    );

    // Should have 4 separate entities
    assert.entityCount("UserTotals", 4);
  });

  test("works alongside existing UserTotals patterns", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const schemaId = "42";

    // Create a regular UserTotals (not schema-specific)
    const regularId = getUserTotalsId(userId);
    const regularUserTotals = getOrCreateUserTotals(regularId);
    regularUserTotals.fileContributionsCount = GraphBigInt.fromI32(10);
    regularUserTotals.save();

    // ACT - Create schema-specific UserTotals
    const schemaUserTotals = getOrCreateUserTotalsForSchemaIndependent(
      userId,
      schemaId,
    );

    // ASSERT - Both should exist independently
    assert.entityCount("UserTotals", 2);

    // Regular UserTotals should be unchanged
    assert.fieldEquals("UserTotals", regularId, "fileContributionsCount", "10");

    // Schema UserTotals should be initialized to zero
    assert.fieldEquals(
      "UserTotals",
      schemaUserTotals.id,
      "fileContributionsCount",
      "0",
    );

    // IDs should be different
    assert.assertTrue(regularId != schemaUserTotals.id);
  });

  test("maintains state across multiple calls", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const schemaId = "42";

    // ACT - First call creates entity
    const userTotals1 = getOrCreateUserTotalsForSchemaIndependent(
      userId,
      schemaId,
    );
    userTotals1.fileContributionsCount = GraphBigInt.fromI32(3);
    userTotals1.save();

    // Second call should return same entity
    const userTotals2 = getOrCreateUserTotalsForSchemaIndependent(
      userId,
      schemaId,
    );

    // ASSERT
    assert.stringEquals(userTotals1.id, userTotals2.id);
    assert.bigIntEquals(
      userTotals2.fileContributionsCount,
      GraphBigInt.fromI32(3),
    );

    // Should still only have one entity
    assert.entityCount("UserTotals", 1);
  });
});
