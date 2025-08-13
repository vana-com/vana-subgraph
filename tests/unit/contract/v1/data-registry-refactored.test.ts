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
  handleDataRegistryProofAddedV1
} from "../../../../src/lib/contract/v1/data-registry";
import { createFileAddedEvent } from "./utils/data-registry-events";
import { createProofAddedEvent } from "./utils/data-registry-events";
import { createNewEpoch, createNewEpochReference } from "../utils";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../../src/lib/entity/epoch";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("V1 Data Registry Refactored Handlers", () => {
  test("handleFileAddedV1 creates File and User entities using shared utilities", () => {
    // ARRANGE
    const fileId = 1;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const url = "ipfs://QmTest123";

    const fileAddedEvent = createFileAddedEvent(fileId, ownerAddress, url);

    // ACT
    handleFileAddedV1(fileAddedEvent);

    // ASSERT
    // Check that File entity was created with correct properties
    assert.entityCount("File", 1);
    assert.fieldEquals("File", fileId.toString(), "id", fileId.toString());
    assert.fieldEquals("File", fileId.toString(), "owner", ownerAddress);
    assert.fieldEquals("File", fileId.toString(), "url", url);
    assert.fieldEquals("File", fileId.toString(), "schemaId", "0"); // V1 should use default schema ID
    assert.fieldEquals("File", fileId.toString(), "addedAtBlock", fileAddedEvent.block.number.toString());
    assert.fieldEquals("File", fileId.toString(), "addedAtTimestamp", fileAddedEvent.block.timestamp.toString());
    assert.fieldEquals("File", fileId.toString(), "transactionHash", fileAddedEvent.transaction.hash.toHexString());

    // Check that User entity was created
    assert.entityCount("User", 1);
    assert.fieldEquals("User", ownerAddress, "id", ownerAddress);
  });

  test("handleDataRegistryProofAddedV1 creates proof and updates totals using shared utilities", () => {
    // ARRANGE
    const fileId = 1;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const url = "ipfs://QmTest123";
    const proofIndex = 0;

    // Create required entities first
    const fileEvent = createFileAddedEvent(fileId, ownerAddress, url);
    handleFileAddedV1(fileEvent);

    // Create epoch entities
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");

    const proofEvent = createProofAddedEvent(fileId, proofIndex);

    // ACT
    handleDataRegistryProofAddedV1(proofEvent);

    // ASSERT
    // Check that DataRegistryProof entity was created
    assert.entityCount("DataRegistryProof", 1);
    const proofId = proofEvent.transaction.hash.toHexString();
    assert.fieldEquals("DataRegistryProof", proofId, "id", proofId);
    assert.fieldEquals("DataRegistryProof", proofId, "epoch", "1");
    assert.fieldEquals("DataRegistryProof", proofId, "fileId", fileId.toString());
    assert.fieldEquals("DataRegistryProof", proofId, "proofIndex", proofIndex.toString());
    assert.fieldEquals("DataRegistryProof", proofId, "createdAt", proofEvent.block.timestamp.toString());
    assert.fieldEquals("DataRegistryProof", proofId, "createdAtBlock", proofEvent.block.number.toString());
    assert.fieldEquals("DataRegistryProof", proofId, "createdTxHash", proofEvent.transaction.hash.toHexString());

    // Check that totals were updated (V1 only has global totals)
    assert.entityCount("Totals", 1);
    assert.fieldEquals("Totals", "global", "totalFileContributions", "1");
    assert.fieldEquals("Totals", "global", "uniqueFileContributors", "1");

    // Check that UserTotals was created
    assert.entityCount("UserTotals", 1);
    const userTotalsId = `user-${ownerAddress}`;
    assert.fieldEquals("UserTotals", userTotalsId, "fileContributionsCount", "1");
  });

  test("handleDataRegistryProofAddedV1 handles missing epoch gracefully", () => {
    // ARRANGE
    const fileId = 1;
    const ownerAddress = "0x1234567890123456789012345678901234567890";
    const url = "ipfs://QmTest123";
    const proofIndex = 0;

    // Create file but NO epoch
    const fileEvent = createFileAddedEvent(fileId, ownerAddress, url);
    handleFileAddedV1(fileEvent);

    const proofEvent = createProofAddedEvent(fileId, proofIndex);

    // ACT
    handleDataRegistryProofAddedV1(proofEvent);

    // ASSERT
    // Should not create any proof or totals when epoch is missing
    assert.entityCount("DataRegistryProof", 0);
    assert.entityCount("Totals", 0);
    assert.entityCount("UserTotals", 0);
  });

  test("handleDataRegistryProofAddedV1 handles missing file gracefully", () => {
    // ARRANGE
    const fileId = 999; // Non-existent file
    const proofIndex = 0;

    // Create epoch but NO file
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");

    const proofEvent = createProofAddedEvent(fileId, proofIndex);

    // ACT
    handleDataRegistryProofAddedV1(proofEvent);

    // ASSERT
    // Should create proof but not update totals when file is missing
    assert.entityCount("DataRegistryProof", 1);
    assert.entityCount("Totals", 0);
    assert.entityCount("UserTotals", 0);
  });
});