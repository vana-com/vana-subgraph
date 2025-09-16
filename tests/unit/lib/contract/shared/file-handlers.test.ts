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
  trackSchemaContribution,
  updateDlpSchemaTotalsForFile,
} from "../../../../../src/lib/contract/shared/file-handlers";
import { Schema, File, Totals, UserTotals } from "../../../../../generated/schema";
import { getOrCreateUser } from "../../../../../src/lib/entity/user";
import { getOrCreateDlp } from "../../../../../src/lib/entity/dlp";
import { getOrCreateTotals } from "../../../../../src/lib/entity/totals/totals";
import { getUserTotalsIdGlobalSchema, getUserTotalsIdSchema } from "../../../../../src/lib/entity/usertotals/constants";

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

describe("Schema Contribution Tracking", () => {
  beforeEach(() => {
    clearStore();
  });

  test("Should track first schema contribution for a user", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(5);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    const user = getOrCreateUser(userAddress);
    const dlp = getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    const file = new File("file-1");
    file.owner = user.id;
    file.ownerAddress = userAddress;
    file.schemaId = schemaId;
    file.save();

    trackSchemaContribution(userAddress, schemaId, dlpAddress);

    const updatedSchema = Schema.load(schemaId.toString());
    assert.assertNotNull(updatedSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema!.contributionsCount);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema!.uniqueContributorsCount);

    const globalSchemaUserTotals = UserTotals.load(getUserTotalsIdGlobalSchema(userAddress, schemaId));
    assert.assertNotNull(globalSchemaUserTotals);
    assert.bigIntEquals(GraphBigInt.fromI32(1), globalSchemaUserTotals!.contributedFileCount);

    const dlpSchemaUserTotals = UserTotals.load(getUserTotalsIdSchema(userAddress, schemaId, dlpAddress));
    assert.assertNotNull(dlpSchemaUserTotals);
    assert.bigIntEquals(GraphBigInt.fromI32(1), dlpSchemaUserTotals!.contributedFileCount);
  });

  test("Should not increment unique contributors count for duplicate user contributions", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(10);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    const user = getOrCreateUser(userAddress);
    const dlp = getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    trackSchemaContribution(userAddress, schemaId, dlpAddress);
    trackSchemaContribution(userAddress, schemaId, dlpAddress);
    trackSchemaContribution(userAddress, schemaId, dlpAddress);

    const updatedSchema = Schema.load(schemaId.toString());
    assert.assertNotNull(updatedSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(3), updatedSchema!.contributionsCount);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema!.uniqueContributorsCount);

    const globalSchemaUserTotals = UserTotals.load(getUserTotalsIdGlobalSchema(userAddress, schemaId));
    assert.bigIntEquals(GraphBigInt.fromI32(3), globalSchemaUserTotals!.contributedFileCount);

    const dlpSchemaUserTotals = UserTotals.load(getUserTotalsIdSchema(userAddress, schemaId, dlpAddress));
    assert.bigIntEquals(GraphBigInt.fromI32(3), dlpSchemaUserTotals!.contributedFileCount);
  });

  test("Should track multiple users contributing to same schema", () => {
    const user1Address = Address.fromString("0x1111111111111111111111111111111111111111");
    const user2Address = Address.fromString("0x2222222222222222222222222222222222222222");
    const user3Address = Address.fromString("0x3333333333333333333333333333333333333333");
    const schemaId = GraphBigInt.fromI32(15);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(user1Address);
    getOrCreateUser(user2Address);
    getOrCreateUser(user3Address);
    getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    trackSchemaContribution(user1Address, schemaId, dlpAddress);
    trackSchemaContribution(user2Address, schemaId, dlpAddress);
    trackSchemaContribution(user1Address, schemaId, dlpAddress);
    trackSchemaContribution(user3Address, schemaId, dlpAddress);
    trackSchemaContribution(user2Address, schemaId, dlpAddress);

    const updatedSchema = Schema.load(schemaId.toString());
    assert.assertNotNull(updatedSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(5), updatedSchema!.contributionsCount);
    assert.bigIntEquals(GraphBigInt.fromI32(3), updatedSchema!.uniqueContributorsCount);
  });

  test("Should not track schema contribution for schemaId 0", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(0);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(userAddress);
    getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    trackSchemaContribution(userAddress, schemaId, dlpAddress);

    const schema = Schema.load(schemaId.toString());
    assert.assertNull(schema);

    const globalSchemaUserTotals = UserTotals.load(getUserTotalsIdGlobalSchema(userAddress, schemaId));
    assert.assertNull(globalSchemaUserTotals);
  });

  test("Should handle schema that doesn't exist", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(999);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(userAddress);
    getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    trackSchemaContribution(userAddress, schemaId, dlpAddress);

    const schema = Schema.load(schemaId.toString());
    assert.assertNull(schema);
  });

  test("Should update DLP schema totals for file with schema", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(20);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(userAddress);
    const dlp = getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));
    const totals = getOrCreateTotals(dlpAddress);
    totals.totalFilesWithSchema = GraphBigInt.fromI32(0);
    totals.uniqueFileContributorsWithSchema = GraphBigInt.fromI32(0);
    totals.save();

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    const file = new File("file-1");
    file.owner = userAddress.toHexString();
    file.ownerAddress = userAddress;
    file.schemaId = schemaId;
    file.save();

    updateDlpSchemaTotalsForFile(file, dlpAddress);

    const updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.assertNotNull(updatedTotals);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedTotals!.uniqueFileContributorsWithSchema);
  });

  test("Should not update DLP schema totals for file without schema", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(0);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(userAddress);
    const dlp = getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));
    const totals = getOrCreateTotals(dlpAddress);
    totals.totalFilesWithSchema = GraphBigInt.fromI32(0);
    totals.uniqueFileContributorsWithSchema = GraphBigInt.fromI32(0);
    totals.save();

    const file = new File("file-1");
    file.owner = userAddress.toHexString();
    file.ownerAddress = userAddress;
    file.schemaId = schemaId;
    file.save();

    updateDlpSchemaTotalsForFile(file, dlpAddress);

    const updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.assertNotNull(updatedTotals);
    assert.bigIntEquals(GraphBigInt.fromI32(0), updatedTotals!.totalFilesWithSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(0), updatedTotals!.uniqueFileContributorsWithSchema);
  });

  test("Should track unique contributors across multiple files with same schema", () => {
    const user1Address = Address.fromString("0x1111111111111111111111111111111111111111");
    const user2Address = Address.fromString("0x2222222222222222222222222222222222222222");
    const schemaId = GraphBigInt.fromI32(25);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(user1Address);
    getOrCreateUser(user2Address);
    const dlp = getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));
    const totals = getOrCreateTotals(dlpAddress);
    totals.totalFilesWithSchema = GraphBigInt.fromI32(0);
    totals.uniqueFileContributorsWithSchema = GraphBigInt.fromI32(0);
    totals.save();

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    const file1 = new File("file-1");
    file1.owner = user1Address.toHexString();
    file1.ownerAddress = user1Address;
    file1.schemaId = schemaId;
    file1.save();

    const file2 = new File("file-2");
    file2.owner = user1Address.toHexString();
    file2.ownerAddress = user1Address;
    file2.schemaId = schemaId;
    file2.save();

    const file3 = new File("file-3");
    file3.owner = user2Address.toHexString();
    file3.ownerAddress = user2Address;
    file3.schemaId = schemaId;
    file3.save();

    updateDlpSchemaTotalsForFile(file1, dlpAddress);
    updateDlpSchemaTotalsForFile(file2, dlpAddress);
    updateDlpSchemaTotalsForFile(file3, dlpAddress);

    const updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.assertNotNull(updatedTotals);
    assert.bigIntEquals(GraphBigInt.fromI32(3), updatedTotals!.totalFilesWithSchema);
    assert.bigIntEquals(GraphBigInt.fromI32(2), updatedTotals!.uniqueFileContributorsWithSchema);
  });

  test("Should track contributions across different schemas independently", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schema1Id = GraphBigInt.fromI32(30);
    const schema2Id = GraphBigInt.fromI32(31);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

    getOrCreateUser(userAddress);
    getOrCreateDlp(dlpAddress, GraphBigInt.fromI32(1000000));

    const schema1 = new Schema(schema1Id.toString());
    schema1.schemaId = schema1Id;
    schema1.contributionsCount = GraphBigInt.fromI32(0);
    schema1.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema1.save();

    const schema2 = new Schema(schema2Id.toString());
    schema2.schemaId = schema2Id;
    schema2.contributionsCount = GraphBigInt.fromI32(0);
    schema2.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema2.save();

    trackSchemaContribution(userAddress, schema1Id, dlpAddress);
    trackSchemaContribution(userAddress, schema2Id, dlpAddress);
    trackSchemaContribution(userAddress, schema1Id, dlpAddress);

    const updatedSchema1 = Schema.load(schema1Id.toString());
    assert.bigIntEquals(GraphBigInt.fromI32(2), updatedSchema1!.contributionsCount);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema1!.uniqueContributorsCount);

    const updatedSchema2 = Schema.load(schema2Id.toString());
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema2!.contributionsCount);
    assert.bigIntEquals(GraphBigInt.fromI32(1), updatedSchema2!.uniqueContributorsCount);
  });

  test("Should track contributions across different DLPs independently", () => {
    const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = GraphBigInt.fromI32(35);
    const dlp1Address = Address.fromString("0xabc0000000000000000000000000000000000001");
    const dlp2Address = Address.fromString("0xdef0000000000000000000000000000000000002");

    getOrCreateUser(userAddress);
    getOrCreateDlp(dlp1Address, GraphBigInt.fromI32(1000000));
    getOrCreateDlp(dlp2Address, GraphBigInt.fromI32(1000000));

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = GraphBigInt.fromI32(0);
    schema.uniqueContributorsCount = GraphBigInt.fromI32(0);
    schema.save();

    trackSchemaContribution(userAddress, schemaId, dlp1Address);
    trackSchemaContribution(userAddress, schemaId, dlp2Address);
    trackSchemaContribution(userAddress, schemaId, dlp1Address);

    const dlp1SchemaUserTotals = UserTotals.load(getUserTotalsIdSchema(userAddress, schemaId, dlp1Address));
    assert.bigIntEquals(GraphBigInt.fromI32(2), dlp1SchemaUserTotals!.contributedFileCount);

    const dlp2SchemaUserTotals = UserTotals.load(getUserTotalsIdSchema(userAddress, schemaId, dlp2Address));
    assert.bigIntEquals(GraphBigInt.fromI32(1), dlp2SchemaUserTotals!.contributedFileCount);

    const globalSchemaUserTotals = UserTotals.load(getUserTotalsIdGlobalSchema(userAddress, schemaId));
    assert.bigIntEquals(GraphBigInt.fromI32(3), globalSchemaUserTotals!.contributedFileCount);
  });
});
