import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  handleDataRegistryProofAddedV3,
  handleFileAddedV3,
} from "../../../../src/lib/contract/v3/data-registry";
import {
  createFileAddedEvent,
  createProofAddedEvent,
} from "./utils/data-registry-events";
import {
  createNewDlp,
  createNewEpoch,
  createNewEpochReference,
  createNewTotals,
  createNewUser,
} from "../utils";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../../src/lib/entity/epoch";
import { createNewFile } from "../utils/file-owner";
import { createNewUserTotals } from "../utils/user-totals";
import {
  getTotalsDlpId,
  TOTALS_ID_GLOBAL,
} from "../../../../src/lib/entity/totals";
import {
  getUserTotalsId,
  getUserTotalsIdDlp,
} from "../../../../src/lib/entity/usertotals";

beforeEach(() => {
  clearStore();
});

describe("handleDataRegistryProofAddedV3", () => {
  test("creates proof, totals, and user totals", () => {
    const user = createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewDlp("1", user.id, "dlp-1");

    const proofEvent = createProofAddedEvent(
      1, // fileId
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce", // ownerAddress
      0, // proofIndex
      1, // dlpId
      100, // score
      "", // proofUrl
    );

    handleDataRegistryProofAddedV3(proofEvent);

    // DataRegistryProof
    assert.entityCount("DataRegistryProof", 1);
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "dlp",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "epoch",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "fileId",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "proofIndex",
      "0",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "user",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );

    // Totals
    assert.entityCount("Totals", 2);

    const totalsId0 = TOTALS_ID_GLOBAL;
    assert.fieldEquals("Totals", totalsId0, "totalFileContributions", "1");
    assert.fieldEquals("Totals", totalsId0, "uniqueFileContributors", "1");

    const totalsId1 = getTotalsDlpId("1");
    assert.fieldEquals("Totals", totalsId1, "totalFileContributions", "1");
    assert.fieldEquals("Totals", totalsId1, "uniqueFileContributors", "1");

    // UserTotals
    assert.entityCount("UserTotals", 2);
    const userTotalsId0 = getUserTotalsId(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "fileContributionsCount",
      "1",
    );

    const userTotalsId1 = getUserTotalsIdDlp(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "fileContributionsCount",
      "1",
    );
  });

  test("creates proof and updates totals / user totals", () => {
    const user = createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewDlp("1", user.id, "dlp-1");
    createNewFile(
      "1",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "ipfs://test",
    );

    const globalTotals = createNewTotals(TOTALS_ID_GLOBAL);
    globalTotals.totalFileContributions = GraphBigInt.fromString("5");
    globalTotals.uniqueFileContributors = GraphBigInt.fromString("3");
    globalTotals.save();

    const dlpTotalsId = getTotalsDlpId("1");
    const dlpTotals = createNewTotals(dlpTotalsId);
    dlpTotals.totalFileContributions = GraphBigInt.fromString("2");
    dlpTotals.uniqueFileContributors = GraphBigInt.fromString("1");
    dlpTotals.save();

    const userTotalsId = getUserTotalsId(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    const userTotals = createNewUserTotals(userTotalsId);
    userTotals.fileContributionsCount = GraphBigInt.fromString("3");
    userTotals.save();

    const dlpUserTotalsId = getUserTotalsIdDlp(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "1",
    );
    const dlpUserTotals = createNewUserTotals(dlpUserTotalsId);
    dlpUserTotals.fileContributionsCount = GraphBigInt.fromString("1");
    dlpUserTotals.save();

    const proofEvent = createProofAddedEvent(
      1, // fileId
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce", // ownerAddress
      0, // proofIndex
      1, // dlpId
      100, // score
      "", // proofUrl
    );

    handleDataRegistryProofAddedV3(proofEvent);

    // DataRegistryProof
    assert.entityCount("DataRegistryProof", 1);
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "dlp",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "epoch",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "fileId",
      "1",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "proofIndex",
      "0",
    );
    assert.fieldEquals(
      "DataRegistryProof",
      proofEvent.transaction.hash.toHex(),
      "user",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );

    // Totals
    assert.entityCount("Totals", 2);

    const totalsId0 = TOTALS_ID_GLOBAL;
    assert.fieldEquals("Totals", totalsId0, "totalFileContributions", "6");
    assert.fieldEquals("Totals", totalsId0, "uniqueFileContributors", "3");

    const totalsId1 = getTotalsDlpId("1");
    assert.fieldEquals("Totals", totalsId1, "totalFileContributions", "3");
    assert.fieldEquals("Totals", totalsId1, "uniqueFileContributors", "1");

    // UserTotals
    assert.entityCount("UserTotals", 2);
    const userTotalsId0 = getUserTotalsId(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "fileContributionsCount",
      "4",
    );

    const userTotalsId1 = getUserTotalsIdDlp(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "fileContributionsCount",
      "2",
    );
  });

  test("fails when current epoch reference is not set", () => {
    const proofEvent = createProofAddedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      0,
      1,
      100,
      "",
    );

    handleDataRegistryProofAddedV3(proofEvent);

    assert.entityCount("DataRegistryProof", 0);
  });

  test("fails when dlp does not exist", () => {
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    const proofEvent = createProofAddedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      0,
      999,
      100,
      "",
    );

    handleDataRegistryProofAddedV3(proofEvent);

    assert.entityCount("DataRegistryProof", 0);
  });
});

describe("handleFileAddedV3", () => {
  test("creates file owner entity", () => {
    const fileAddedEvent = createFileAddedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "https://www.some.com/storage/url",
    );

    handleFileAddedV3(fileAddedEvent);

    // FileOwner
    assert.entityCount("FileOwner", 1);

    const fileOwnerId = "1";
    assert.fieldEquals(
      "FileOwner",
      fileOwnerId,
      "ownerAddress",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
  });
});
