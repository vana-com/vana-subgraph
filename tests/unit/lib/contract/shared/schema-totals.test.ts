import { afterEach, describe, test } from "matchstick-as/assembly/index";
import { assert } from "matchstick-as/assembly/assert";
import { clearStore } from "@graphprotocol/graph-ts";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Totals, UserTotals, File } from "../../../../../generated/schema";
import {
  updateGlobalSchemaTotals,
  updateDlpSchemaTotals
} from "../../../../../src/lib/contract/shared/totals-updater";
import { getOrCreateTotals } from "../../../../../src/lib/entity/totals/totals";
import { getOrCreateUser } from "../../../../../src/lib/entity/user";
import { getOrCreateDlp } from "../../../../../src/lib/entity/dlp";
import { getUserTotalsId } from "../../../../../src/lib/entity/usertotals/constants";
import { getOrCreateUserTotals } from "../../../../../src/lib/entity/usertotals/user-totals";

describe("Global and DLP Schema Totals Updates", () => {
  afterEach(() => {
    clearStore();
  });

  describe("updateGlobalSchemaTotals", () => {
    test("Should increment global schema totals for new contributor", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(5);

      const user = getOrCreateUser(userAddress);
      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(0);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      globalTotals.save();

      const file = new File("file-1");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateGlobalSchemaTotals(file);

      const updatedTotals = Totals.load(Address.zero().toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should increment file count but not unique contributors for existing contributor", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(10);

      const user = getOrCreateUser(userAddress);
      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(5);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(3);
      globalTotals.save();

      const userTotals = getOrCreateUserTotals(userAddress);
      userTotals.contributedFileCountWithSchema = BigInt.fromI32(2);
      userTotals.save();

      const file = new File("file-2");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateGlobalSchemaTotals(file);

      const updatedTotals = Totals.load(Address.zero().toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(6), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(3), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should not update totals for file without schema (schemaId = 0)", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(0);

      const user = getOrCreateUser(userAddress);
      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(10);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(5);
      globalTotals.save();

      const file = new File("file-3");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateGlobalSchemaTotals(file);

      const updatedTotals = Totals.load(Address.zero().toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(10), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(5), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should track multiple users contributing files with schemas", () => {
      const user1Address = Address.fromString("0x1111111111111111111111111111111111111111");
      const user2Address = Address.fromString("0x2222222222222222222222222222222222222222");
      const user3Address = Address.fromString("0x3333333333333333333333333333333333333333");
      const schema1 = BigInt.fromI32(15);
      const schema2 = BigInt.fromI32(16);

      const user1 = getOrCreateUser(user1Address);
      const user2 = getOrCreateUser(user2Address);
      const user3 = getOrCreateUser(user3Address);

      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(0);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      globalTotals.save();

      const file1 = new File("file-1");
      file1.owner = user1.id;
      file1.ownerAddress = user1Address;
      file1.schemaId = schema1;
      file1.save();

      const file2 = new File("file-2");
      file2.owner = user2.id;
      file2.ownerAddress = user2Address;
      file2.schemaId = schema2;
      file2.save();

      const file3 = new File("file-3");
      file3.owner = user1.id;
      file3.ownerAddress = user1Address;
      file3.schemaId = schema2;
      file3.save();

      const file4 = new File("file-4");
      file4.owner = user3.id;
      file4.ownerAddress = user3Address;
      file4.schemaId = schema1;
      file4.save();

      updateGlobalSchemaTotals(file1);
      updateGlobalSchemaTotals(file2);
      updateGlobalSchemaTotals(file3);
      updateGlobalSchemaTotals(file4);

      const updatedTotals = Totals.load(Address.zero().toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(4), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(3), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should update user totals contributedFileCountWithSchema", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const schemaId = BigInt.fromI32(20);

      const user = getOrCreateUser(userAddress);
      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(0);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      globalTotals.save();

      const file1 = new File("file-1");
      file1.owner = user.id;
      file1.ownerAddress = userAddress;
      file1.schemaId = schemaId;
      file1.save();

      const file2 = new File("file-2");
      file2.owner = user.id;
      file2.ownerAddress = userAddress;
      file2.schemaId = schemaId;
      file2.save();

      updateGlobalSchemaTotals(file1);
      updateGlobalSchemaTotals(file2);

      const userTotals = UserTotals.load(getUserTotalsId(userAddress));
      assert.assertNotNull(userTotals);
      assert.bigIntEquals(BigInt.fromI32(2), userTotals!.contributedFileCountWithSchema);
    });
  });

  describe("updateDlpSchemaTotals", () => {
    test("Should increment DLP schema totals for new contributor", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(25);

      const user = getOrCreateUser(userAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));
      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(0);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      dlpTotals.save();

      const file = new File("file-1");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateDlpSchemaTotals(file, dlpAddress);

      const updatedTotals = Totals.load(dlpAddress.toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should increment file count but not unique contributors for existing DLP contributor", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(30);

      const user = getOrCreateUser(userAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));
      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(10);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(5);
      dlpTotals.save();

      const userTotals = getOrCreateUserTotals(userAddress, dlpAddress);
      userTotals.contributedFileCountWithSchema = BigInt.fromI32(3);
      userTotals.save();

      const file = new File("file-2");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateDlpSchemaTotals(file, dlpAddress);

      const updatedTotals = Totals.load(dlpAddress.toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(11), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(5), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should not update DLP totals for file without schema", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(0);

      const user = getOrCreateUser(userAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));
      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(20);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(10);
      dlpTotals.save();

      const file = new File("file-3");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateDlpSchemaTotals(file, dlpAddress);

      const updatedTotals = Totals.load(dlpAddress.toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(20), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(10), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should track totals independently across different DLPs", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlp1Address = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2Address = Address.fromString("0xdef0000000000000000000000000000000000002");
      const schemaId = BigInt.fromI32(35);

      const user = getOrCreateUser(userAddress);
      const dlp1 = getOrCreateDlp(dlp1Address, BigInt.fromI32(1000000));
      const dlp2 = getOrCreateDlp(dlp2Address, BigInt.fromI32(1000000));

      const dlp1Totals = getOrCreateTotals(dlp1Address);
      dlp1Totals.totalFilesWithSchema = BigInt.fromI32(0);
      dlp1Totals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      dlp1Totals.save();

      const dlp2Totals = getOrCreateTotals(dlp2Address);
      dlp2Totals.totalFilesWithSchema = BigInt.fromI32(0);
      dlp2Totals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      dlp2Totals.save();

      const file1 = new File("file-1");
      file1.owner = user.id;
      file1.ownerAddress = userAddress;
      file1.schemaId = schemaId;
      file1.save();

      const file2 = new File("file-2");
      file2.owner = user.id;
      file2.ownerAddress = userAddress;
      file2.schemaId = schemaId;
      file2.save();

      updateDlpSchemaTotals(file1, dlp1Address);
      updateDlpSchemaTotals(file2, dlp2Address);
      updateDlpSchemaTotals(file2, dlp1Address);

      const updatedDlp1Totals = Totals.load(dlp1Address.toHexString());
      assert.bigIntEquals(BigInt.fromI32(2), updatedDlp1Totals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(1), updatedDlp1Totals!.uniqueFileContributorsWithSchema);

      const updatedDlp2Totals = Totals.load(dlp2Address.toHexString());
      assert.bigIntEquals(BigInt.fromI32(1), updatedDlp2Totals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(1), updatedDlp2Totals!.uniqueFileContributorsWithSchema);
    });

    test("Should track multiple users in same DLP", () => {
      const user1Address = Address.fromString("0x1111111111111111111111111111111111111111");
      const user2Address = Address.fromString("0x2222222222222222222222222222222222222222");
      const user3Address = Address.fromString("0x3333333333333333333333333333333333333333");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(40);

      const user1 = getOrCreateUser(user1Address);
      const user2 = getOrCreateUser(user2Address);
      const user3 = getOrCreateUser(user3Address);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));

      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(0);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      dlpTotals.save();

      const file1 = new File("file-1");
      file1.owner = user1.id;
      file1.ownerAddress = user1Address;
      file1.schemaId = schemaId;
      file1.save();

      const file2 = new File("file-2");
      file2.owner = user2.id;
      file2.ownerAddress = user2Address;
      file2.schemaId = schemaId;
      file2.save();

      const file3 = new File("file-3");
      file3.owner = user1.id;
      file3.ownerAddress = user1Address;
      file3.schemaId = schemaId;
      file3.save();

      const file4 = new File("file-4");
      file4.owner = user3.id;
      file4.ownerAddress = user3Address;
      file4.schemaId = schemaId;
      file4.save();

      updateDlpSchemaTotals(file1, dlpAddress);
      updateDlpSchemaTotals(file2, dlpAddress);
      updateDlpSchemaTotals(file3, dlpAddress);
      updateDlpSchemaTotals(file4, dlpAddress);

      const updatedTotals = Totals.load(dlpAddress.toHexString());
      assert.assertNotNull(updatedTotals);
      assert.bigIntEquals(BigInt.fromI32(4), updatedTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(3), updatedTotals!.uniqueFileContributorsWithSchema);
    });

    test("Should update DLP user totals contributedFileCountWithSchema", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(45);

      const user = getOrCreateUser(userAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));
      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(0);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
      dlpTotals.save();

      const file1 = new File("file-1");
      file1.owner = user.id;
      file1.ownerAddress = userAddress;
      file1.schemaId = schemaId;
      file1.save();

      const file2 = new File("file-2");
      file2.owner = user.id;
      file2.ownerAddress = userAddress;
      file2.schemaId = schemaId;
      file2.save();

      const file3 = new File("file-3");
      file3.owner = user.id;
      file3.ownerAddress = userAddress;
      file3.schemaId = schemaId;
      file3.save();

      updateDlpSchemaTotals(file1, dlpAddress);
      updateDlpSchemaTotals(file2, dlpAddress);
      updateDlpSchemaTotals(file3, dlpAddress);

      const userTotals = UserTotals.load(getUserTotalsId(userAddress, dlpAddress));
      assert.assertNotNull(userTotals);
      assert.bigIntEquals(BigInt.fromI32(3), userTotals!.contributedFileCountWithSchema);
    });
  });

  describe("Global and DLP schema totals interaction", () => {
    test("Should update both global and DLP totals independently", () => {
      const userAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const schemaId = BigInt.fromI32(50);

      const user = getOrCreateUser(userAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));

      const globalTotals = getOrCreateTotals(Address.zero());
      globalTotals.totalFilesWithSchema = BigInt.fromI32(100);
      globalTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(50);
      globalTotals.save();

      const dlpTotals = getOrCreateTotals(dlpAddress);
      dlpTotals.totalFilesWithSchema = BigInt.fromI32(10);
      dlpTotals.uniqueFileContributorsWithSchema = BigInt.fromI32(5);
      dlpTotals.save();

      const file = new File("file-1");
      file.owner = user.id;
      file.ownerAddress = userAddress;
      file.schemaId = schemaId;
      file.save();

      updateGlobalSchemaTotals(file);
      updateDlpSchemaTotals(file, dlpAddress);

      const updatedGlobalTotals = Totals.load(Address.zero().toHexString());
      assert.bigIntEquals(BigInt.fromI32(101), updatedGlobalTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(51), updatedGlobalTotals!.uniqueFileContributorsWithSchema);

      const updatedDlpTotals = Totals.load(dlpAddress.toHexString());
      assert.bigIntEquals(BigInt.fromI32(11), updatedDlpTotals!.totalFilesWithSchema);
      assert.bigIntEquals(BigInt.fromI32(6), updatedDlpTotals!.uniqueFileContributorsWithSchema);
    });
  });
});