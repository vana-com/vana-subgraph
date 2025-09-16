import { afterEach, describe, test } from "matchstick-as/assembly/index";
import { assert } from "matchstick-as/assembly/assert";
import { clearStore } from "@graphprotocol/graph-ts";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { UserTotals } from "../../../../../generated/schema";
import {
  getUserTotalsIdSchema,
  getUserTotalsIdGlobalSchema
} from "../../../../../src/lib/entity/usertotals/constants";
import {
  getOrCreateUserTotalsForSchema,
  getOrCreateUserTotalsForGlobalSchema
} from "../../../../../src/lib/entity/usertotals/user-totals";
import { getOrCreateUser } from "../../../../../src/lib/entity/user";

describe("Schema-specific User Totals", () => {
  afterEach(() => {
    clearStore();
  });

  describe("getUserTotalsIdSchema", () => {
    test("Should generate correct ID for schema-specific user totals", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(42);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const id = getUserTotalsIdSchema(userAddress, schemaId, dlpAddress);

      assert.stringEquals(
        "0x1234567890123456789012345678901234567890-schema-42-0xabc0000000000000000000000000000000000001",
        id
      );
    });

    test("Should generate different IDs for different schemas", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schema1 = BigInt.fromI32(1);
      const schema2 = BigInt.fromI32(2);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const id1 = getUserTotalsIdSchema(userAddress, schema1, dlpAddress);
      const id2 = getUserTotalsIdSchema(userAddress, schema2, dlpAddress);

      assert.assertTrue(id1 != id2);
    });

    test("Should generate different IDs for different users", () => {
      const user1 = Address.fromString("0x1111111111111111111111111111111111111111");
      const user2 = Address.fromString("0x2222222222222222222222222222222222222222");
      const schemaId = BigInt.fromI32(10);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const id1 = getUserTotalsIdSchema(user1, schemaId, dlpAddress);
      const id2 = getUserTotalsIdSchema(user2, schemaId, dlpAddress);

      assert.assertTrue(id1 != id2);
    });

    test("Should generate different IDs for different DLPs", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(10);
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      const id1 = getUserTotalsIdSchema(userAddress, schemaId, dlp1);
      const id2 = getUserTotalsIdSchema(userAddress, schemaId, dlp2);

      assert.assertTrue(id1 != id2);
    });
  });

  describe("getUserTotalsIdGlobalSchema", () => {
    test("Should generate correct ID for global schema user totals", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(99);

      const id = getUserTotalsIdGlobalSchema(userAddress, schemaId);

      assert.stringEquals(
        "0x1234567890123456789012345678901234567890-global-schema-99",
        id
      );
    });

    test("Should generate different IDs for different schemas", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schema1 = BigInt.fromI32(10);
      const schema2 = BigInt.fromI32(20);

      const id1 = getUserTotalsIdGlobalSchema(userAddress, schema1);
      const id2 = getUserTotalsIdGlobalSchema(userAddress, schema2);

      assert.assertTrue(id1 != id2);
      assert.stringEquals("0x1234567890123456789012345678901234567890-global-schema-10", id1);
      assert.stringEquals("0x1234567890123456789012345678901234567890-global-schema-20", id2);
    });

    test("Should generate different IDs for different users", () => {
      const user1 = Address.fromString("0x1111111111111111111111111111111111111111");
      const user2 = Address.fromString("0x2222222222222222222222222222222222222222");
      const schemaId = BigInt.fromI32(5);

      const id1 = getUserTotalsIdGlobalSchema(user1, schemaId);
      const id2 = getUserTotalsIdGlobalSchema(user2, schemaId);

      assert.assertTrue(id1 != id2);
    });

    test("Should not include DLP in global schema ID", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(15);

      const id = getUserTotalsIdGlobalSchema(userAddress, schemaId);

      assert.assertFalse(id.includes("dlp"));
      assert.assertTrue(id.includes("global-schema"));
    });
  });

  describe("getOrCreateUserTotalsForSchema", () => {
    test("Should create new user totals for schema with correct ID", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(7);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const user = getOrCreateUser(userAddress);
      const userTotals = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlpAddress);

      const expectedId = getUserTotalsIdSchema(userAddress, schemaId, dlpAddress);
      assert.stringEquals(expectedId, userTotals.id);
      assert.stringEquals(user.id, userTotals.user);
      assert.bigIntEquals(BigInt.fromI32(0), userTotals.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(0), userTotals.verifiedFileCount);
    });

    test("Should return existing user totals if already created", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(8);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      getOrCreateUser(userAddress);

      const userTotals1 = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlpAddress);
      userTotals1.contributedFileCount = BigInt.fromI32(5);
      userTotals1.save();

      const userTotals2 = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlpAddress);

      assert.stringEquals(userTotals1.id, userTotals2.id);
      assert.bigIntEquals(BigInt.fromI32(5), userTotals2.contributedFileCount);
    });

    test("Should create separate totals for different schemas", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schema1 = BigInt.fromI32(10);
      const schema2 = BigInt.fromI32(11);
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      getOrCreateUser(userAddress);

      const totals1 = getOrCreateUserTotalsForSchema(userAddress, schema1, dlpAddress);
      totals1.contributedFileCount = BigInt.fromI32(3);
      totals1.save();

      const totals2 = getOrCreateUserTotalsForSchema(userAddress, schema2, dlpAddress);
      totals2.contributedFileCount = BigInt.fromI32(7);
      totals2.save();

      assert.assertTrue(totals1.id != totals2.id);
      assert.bigIntEquals(BigInt.fromI32(3), totals1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(7), totals2.contributedFileCount);
    });

    test("Should create separate totals for different DLPs", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(12);
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      getOrCreateUser(userAddress);

      const totals1 = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlp1);
      totals1.contributedFileCount = BigInt.fromI32(4);
      totals1.save();

      const totals2 = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlp2);
      totals2.contributedFileCount = BigInt.fromI32(6);
      totals2.save();

      assert.assertTrue(totals1.id != totals2.id);
      assert.bigIntEquals(BigInt.fromI32(4), totals1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(6), totals2.contributedFileCount);
    });
  });

  describe("getOrCreateUserTotalsForGlobalSchema", () => {
    test("Should create new global schema user totals", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(20);

      const user = getOrCreateUser(userAddress);
      const userTotals = getOrCreateUserTotalsForGlobalSchema(userAddress, schemaId);

      const expectedId = getUserTotalsIdGlobalSchema(userAddress, schemaId);
      assert.stringEquals(expectedId, userTotals.id);
      assert.stringEquals(user.id, userTotals.user);
      assert.bigIntEquals(BigInt.fromI32(0), userTotals.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(0), userTotals.verifiedFileCount);
    });

    test("Should return existing global schema user totals", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(21);

      getOrCreateUser(userAddress);

      const totals1 = getOrCreateUserTotalsForGlobalSchema(userAddress, schemaId);
      totals1.contributedFileCount = BigInt.fromI32(10);
      totals1.save();

      const totals2 = getOrCreateUserTotalsForGlobalSchema(userAddress, schemaId);

      assert.stringEquals(totals1.id, totals2.id);
      assert.bigIntEquals(BigInt.fromI32(10), totals2.contributedFileCount);
    });

    test("Should create separate global totals for different schemas", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schema1 = BigInt.fromI32(25);
      const schema2 = BigInt.fromI32(26);

      getOrCreateUser(userAddress);

      const totals1 = getOrCreateUserTotalsForGlobalSchema(userAddress, schema1);
      totals1.contributedFileCount = BigInt.fromI32(15);
      totals1.save();

      const totals2 = getOrCreateUserTotalsForGlobalSchema(userAddress, schema2);
      totals2.contributedFileCount = BigInt.fromI32(20);
      totals2.save();

      assert.assertTrue(totals1.id != totals2.id);
      assert.bigIntEquals(BigInt.fromI32(15), totals1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(20), totals2.contributedFileCount);
    });

    test("Should create separate global totals for different users", () => {
      const user1 = Address.fromString("0x1111111111111111111111111111111111111111");
      const user2 = Address.fromString("0x2222222222222222222222222222222222222222");
      const schemaId = BigInt.fromI32(30);

      getOrCreateUser(user1);
      getOrCreateUser(user2);

      const totals1 = getOrCreateUserTotalsForGlobalSchema(user1, schemaId);
      totals1.contributedFileCount = BigInt.fromI32(25);
      totals1.save();

      const totals2 = getOrCreateUserTotalsForGlobalSchema(user2, schemaId);
      totals2.contributedFileCount = BigInt.fromI32(30);
      totals2.save();

      assert.assertTrue(totals1.id != totals2.id);
      assert.bigIntEquals(BigInt.fromI32(25), totals1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(30), totals2.contributedFileCount);
    });

    test("Global schema totals should be independent of DLP totals", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(35);
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      getOrCreateUser(userAddress);

      const globalTotals = getOrCreateUserTotalsForGlobalSchema(userAddress, schemaId);
      globalTotals.contributedFileCount = BigInt.fromI32(100);
      globalTotals.save();

      const dlp1Totals = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlp1);
      dlp1Totals.contributedFileCount = BigInt.fromI32(40);
      dlp1Totals.save();

      const dlp2Totals = getOrCreateUserTotalsForSchema(userAddress, schemaId, dlp2);
      dlp2Totals.contributedFileCount = BigInt.fromI32(60);
      dlp2Totals.save();

      assert.bigIntEquals(BigInt.fromI32(100), globalTotals.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(40), dlp1Totals.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(60), dlp2Totals.contributedFileCount);

      assert.assertTrue(globalTotals.id != dlp1Totals.id);
      assert.assertTrue(globalTotals.id != dlp2Totals.id);
      assert.assertTrue(dlp1Totals.id != dlp2Totals.id);
    });
  });

  describe("Schema user totals integration", () => {
    test("Should track contributions across multiple schemas and DLPs", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schema1 = BigInt.fromI32(40);
      const schema2 = BigInt.fromI32(41);
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      getOrCreateUser(userAddress);

      const s1d1 = getOrCreateUserTotalsForSchema(userAddress, schema1, dlp1);
      s1d1.contributedFileCount = BigInt.fromI32(5);
      s1d1.save();

      const s1d2 = getOrCreateUserTotalsForSchema(userAddress, schema1, dlp2);
      s1d2.contributedFileCount = BigInt.fromI32(3);
      s1d2.save();

      const s2d1 = getOrCreateUserTotalsForSchema(userAddress, schema2, dlp1);
      s2d1.contributedFileCount = BigInt.fromI32(7);
      s2d1.save();

      const s2d2 = getOrCreateUserTotalsForSchema(userAddress, schema2, dlp2);
      s2d2.contributedFileCount = BigInt.fromI32(2);
      s2d2.save();

      const globalS1 = getOrCreateUserTotalsForGlobalSchema(userAddress, schema1);
      globalS1.contributedFileCount = BigInt.fromI32(8);
      globalS1.save();

      const globalS2 = getOrCreateUserTotalsForGlobalSchema(userAddress, schema2);
      globalS2.contributedFileCount = BigInt.fromI32(9);
      globalS2.save();

      assert.entityCount("UserTotals", 6);
      assert.bigIntEquals(BigInt.fromI32(5), s1d1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(3), s1d2.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(7), s2d1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(2), s2d2.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(8), globalS1.contributedFileCount);
      assert.bigIntEquals(BigInt.fromI32(9), globalS2.contributedFileCount);
    });
  });
});