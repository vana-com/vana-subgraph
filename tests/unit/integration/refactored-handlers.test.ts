import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  handleFileAddedV1,
  handleDataRegistryProofAddedV1,
} from "../../../src/lib/contract/v1/data-registry";
import {
  handleFileAddedV2,
  handleDataRegistryProofAddedV2,
} from "../../../src/lib/contract/v2/data-registry";
import {
  handleFileAddedV3,
  handleDataRegistryProofAddedV3,
} from "../../../src/lib/contract/v3/data-registry";
import { createFileAddedEvent } from "../contract/v1/utils/data-registry-events";
import { createProofAddedEvent } from "../contract/v1/utils/data-registry-events";
import { createFileAddedEvent as createFileAddedEventV2 } from "../contract/v2/utils/data-registry-events";
import { createProofAddedEvent as createProofAddedEventV2 } from "../contract/v2/utils/data-registry-events";
import { createFileAddedEvent as createFileAddedEventV3 } from "../contract/v3/utils/data-registry-events";
import { createProofAddedEvent as createProofAddedEventV3 } from "../contract/v3/utils/data-registry-events";
import {
  createNewEpoch,
  createNewEpochReference,
  createNewDlp,
  createNewUser,
} from "../contract/utils";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../src/lib/entity/epoch";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("Integration Tests for Refactored Handlers", () => {
  test("V1, V2, and V3 handlers all use shared utilities correctly", () => {
    // ARRANGE
    const fileId1 = 1;
    const fileId2 = 2;
    const fileId3 = 3;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const dlpId = "1";
    const url = "ipfs://QmTest123";

    // Create required entities
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewUser(ownerAddress);
    createNewDlp(dlpId, ownerAddress, "Test DLP");

    // Create file events for all versions
    const fileEventV1 = createFileAddedEvent(fileId1, ownerAddress, url);
    const fileEventV2 = createFileAddedEventV2(fileId2, ownerAddress, url);
    const fileEventV3 = createFileAddedEventV3(fileId3, ownerAddress, url);

    // ACT - Handle file events
    handleFileAddedV1(fileEventV1);
    handleFileAddedV2(fileEventV2);
    handleFileAddedV3(fileEventV3);

    // ASSERT - All versions should create File entities with correct schema IDs
    assert.entityCount("File", 3);
    assert.fieldEquals("File", fileId1.toString(), "schemaId", "0"); // V1 default
    assert.fieldEquals("File", fileId2.toString(), "schemaId", "0"); // V2 default
    assert.fieldEquals("File", fileId3.toString(), "schemaId", "0"); // V3 default

    // All should have same owner
    assert.fieldEquals("File", fileId1.toString(), "owner", ownerAddress);
    assert.fieldEquals("File", fileId2.toString(), "owner", ownerAddress);
    assert.fieldEquals("File", fileId3.toString(), "owner", ownerAddress);

    // Only one User entity should be created (shared utility)
    assert.entityCount("User", 1);
    assert.fieldEquals("User", ownerAddress, "id", ownerAddress);
  });

  test("V1, V2, and V3 proof handlers create different proof structures", () => {
    // ARRANGE
    const fileId1 = 1;
    const fileId2 = 2;
    const fileId3 = 3;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const dlpId = "1";
    const url = "ipfs://QmTest123";
    const proofIndex = 0;

    // Create required entities
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewUser(ownerAddress);
    createNewDlp(dlpId, ownerAddress, "Test DLP");

    // Create files first
    const fileEventV1 = createFileAddedEvent(fileId1, ownerAddress, url);
    const fileEventV2 = createFileAddedEventV2(fileId2, ownerAddress, url);
    const fileEventV3 = createFileAddedEventV3(fileId3, ownerAddress, url);

    handleFileAddedV1(fileEventV1);
    handleFileAddedV2(fileEventV2);
    handleFileAddedV3(fileEventV3);

    // Create proof events
    const proofEventV1 = createProofAddedEvent(fileId1, proofIndex);
    const proofEventV2 = createProofAddedEventV2(
      fileId2,
      proofIndex,
      Number.parseInt(dlpId),
      100,
    );
    const proofEventV3 = createProofAddedEventV3(
      fileId3,
      ownerAddress,
      Number.parseInt(dlpId),
      proofIndex,
      100,
      "test",
    );

    // ACT - Handle proof events
    handleDataRegistryProofAddedV1(proofEventV1);
    handleDataRegistryProofAddedV2(proofEventV2);
    handleDataRegistryProofAddedV3(proofEventV3);

    // ASSERT - All versions should create DataRegistryProof entities
    assert.entityCount("DataRegistryProof", 3);

    // V1 proof should not have user or DLP
    const proofIdV1 = proofEventV1.transaction.hash.toHexString();
    assert.fieldEquals("DataRegistryProof", proofIdV1, "epoch", "1");
    assert.fieldEquals(
      "DataRegistryProof",
      proofIdV1,
      "fileId",
      fileId1.toString(),
    );

    // V2 proof should have DLP but not user
    const proofIdV2 = proofEventV2.transaction.hash.toHexString();
    assert.fieldEquals("DataRegistryProof", proofIdV2, "dlp", dlpId);
    assert.fieldEquals("DataRegistryProof", proofIdV2, "epoch", "1");

    // V3 proof should have both user and DLP
    const proofIdV3 = proofEventV3.transaction.hash.toHexString();
    assert.fieldEquals("DataRegistryProof", proofIdV3, "user", ownerAddress);
    assert.fieldEquals("DataRegistryProof", proofIdV3, "dlp", dlpId);
    assert.fieldEquals("DataRegistryProof", proofIdV3, "epoch", "1");
  });

  test("Totals are updated correctly across all versions", () => {
    // ARRANGE
    const fileId1 = 1;
    const fileId2 = 2;
    const fileId3 = 3;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const dlpId = "1";
    const url = "ipfs://QmTest123";
    const proofIndex = 0;

    // Create required entities
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewUser(ownerAddress);
    createNewDlp(dlpId, ownerAddress, "Test DLP");

    // Create files
    const fileEventV1 = createFileAddedEvent(fileId1, ownerAddress, url);
    const fileEventV2 = createFileAddedEventV2(fileId2, ownerAddress, url);
    const fileEventV3 = createFileAddedEventV3(fileId3, ownerAddress, url);

    handleFileAddedV1(fileEventV1);
    handleFileAddedV2(fileEventV2);
    handleFileAddedV3(fileEventV3);

    // Create proof events
    const proofEventV1 = createProofAddedEvent(fileId1, proofIndex);
    const proofEventV2 = createProofAddedEventV2(
      fileId2,
      proofIndex,
      Number.parseInt(dlpId),
      100,
    );
    const proofEventV3 = createProofAddedEventV3(
      fileId3,
      ownerAddress,
      Number.parseInt(dlpId),
      proofIndex,
      100,
      "test",
    );

    // ACT - Handle proof events
    handleDataRegistryProofAddedV1(proofEventV1);
    handleDataRegistryProofAddedV2(proofEventV2);
    handleDataRegistryProofAddedV3(proofEventV3);

    // ASSERT - Check global totals
    assert.entityCount("Totals", 2); // Global + DLP totals
    assert.fieldEquals("Totals", "global", "totalFileContributions", "3");
    assert.fieldEquals("Totals", "global", "uniqueFileContributors", "1"); // Same user

    // Check DLP totals (V2 and V3 should contribute)
    const dlpTotalsId = `dlp-${dlpId}`;
    assert.fieldEquals("Totals", dlpTotalsId, "totalFileContributions", "2");
    assert.fieldEquals("Totals", dlpTotalsId, "uniqueFileContributors", "1");

    // Check user totals
    const userTotalsId = `user-${ownerAddress}`;
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "3",
    );

    // Check DLP user totals
    const dlpUserTotalsId = `user-${ownerAddress}-dlp-${dlpId}`;
    assert.fieldEquals(
      "UserTotals",
      dlpUserTotalsId,
      "fileContributionsCount",
      "2",
    );
  });
});
