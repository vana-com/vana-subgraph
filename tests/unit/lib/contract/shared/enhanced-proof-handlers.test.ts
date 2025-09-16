import { afterEach, describe, test } from "matchstick-as/assembly/index";
import { assert } from "matchstick-as/assembly/assert";
import { clearStore } from "@graphprotocol/graph-ts";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { DataRegistryProof, File } from "../../../../../generated/schema";
import {
  getProofId,
  isFirstProofForFile,
  createProofFromEvent,
} from "../../../../../src/lib/contract/shared/proof-handlers";
import { getOrCreateUser } from "../../../../../src/lib/entity/user";
import { getOrCreateDlp } from "../../../../../src/lib/entity/dlp";
import { incrementCounter, getCounterValue, getFileDlpProofsCounterId } from "../../../../../src/lib/entity/counter";

describe("Enhanced Proof Handlers - New Proof ID System", () => {
  afterEach(() => {
    clearStore();
  });

  describe("getProofId", () => {
    test("Should generate correct composite proof ID", () => {
      const fileId = "file-123";
      const proofIndex = BigInt.fromI32(0);

      const proofId = getProofId(fileId, proofIndex);

      assert.stringEquals("file-file-123-proof-0", proofId);
    });

    test("Should generate different IDs for different proof indices", () => {
      const fileId = "file-456";
      const proofIndex1 = BigInt.fromI32(0);
      const proofIndex2 = BigInt.fromI32(1);
      const proofIndex3 = BigInt.fromI32(10);

      const proofId1 = getProofId(fileId, proofIndex1);
      const proofId2 = getProofId(fileId, proofIndex2);
      const proofId3 = getProofId(fileId, proofIndex3);

      assert.stringEquals("file-file-456-proof-0", proofId1);
      assert.stringEquals("file-file-456-proof-1", proofId2);
      assert.stringEquals("file-file-456-proof-10", proofId3);
    });

    test("Should generate different IDs for different files", () => {
      const fileId1 = "file-111";
      const fileId2 = "file-222";
      const proofIndex = BigInt.fromI32(0);

      const proofId1 = getProofId(fileId1, proofIndex);
      const proofId2 = getProofId(fileId2, proofIndex);

      assert.assertTrue(proofId1 != proofId2);
      assert.stringEquals("file-file-111-proof-0", proofId1);
      assert.stringEquals("file-file-222-proof-0", proofId2);
    });

    test("Should handle large proof indices", () => {
      const fileId = "file-789";
      const largeIndex = BigInt.fromI32(999999);

      const proofId = getProofId(fileId, largeIndex);

      assert.stringEquals("file-file-789-proof-999999", proofId);
    });

    test("Should handle special characters in file ID", () => {
      const fileId = "file-with-special-!@#$%-chars";
      const proofIndex = BigInt.fromI32(5);

      const proofId = getProofId(fileId, proofIndex);

      assert.stringEquals("file-file-with-special-!@#$%-chars-proof-5", proofId);
    });
  });

  describe("isFirstProofForFile", () => {
    test("Should return true for first proof of a file", () => {
      const fileId = "file-001";
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const isFirst = isFirstProofForFile(fileId, dlpAddress);

      assert.assertTrue(isFirst);
    });

    test("Should return false for subsequent proofs of same file", () => {
      const fileId = "file-002";
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const isFirst1 = isFirstProofForFile(fileId, dlpAddress);
      const isFirst2 = isFirstProofForFile(fileId, dlpAddress);
      const isFirst3 = isFirstProofForFile(fileId, dlpAddress);

      assert.assertTrue(isFirst1);
      assert.assertFalse(isFirst2);
      assert.assertFalse(isFirst3);
    });

    test("Should track proofs independently for different DLPs", () => {
      const fileId = "file-003";
      const dlp1Address = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2Address = Address.fromString("0xdef0000000000000000000000000000000000002");

      const isFirstDlp1_1 = isFirstProofForFile(fileId, dlp1Address);
      const isFirstDlp2_1 = isFirstProofForFile(fileId, dlp2Address);
      const isFirstDlp1_2 = isFirstProofForFile(fileId, dlp1Address);
      const isFirstDlp2_2 = isFirstProofForFile(fileId, dlp2Address);

      assert.assertTrue(isFirstDlp1_1);
      assert.assertTrue(isFirstDlp2_1);
      assert.assertFalse(isFirstDlp1_2);
      assert.assertFalse(isFirstDlp2_2);
    });

    test("Should track proofs independently for different files", () => {
      const fileId1 = "file-004";
      const fileId2 = "file-005";
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const isFirstFile1_1 = isFirstProofForFile(fileId1, dlpAddress);
      const isFirstFile2_1 = isFirstProofForFile(fileId2, dlpAddress);
      const isFirstFile1_2 = isFirstProofForFile(fileId1, dlpAddress);
      const isFirstFile2_2 = isFirstProofForFile(fileId2, dlpAddress);

      assert.assertTrue(isFirstFile1_1);
      assert.assertTrue(isFirstFile2_1);
      assert.assertFalse(isFirstFile1_2);
      assert.assertFalse(isFirstFile2_2);
    });

    test("Should correctly track multiple files across multiple DLPs", () => {
      const file1 = "file-006";
      const file2 = "file-007";
      const file3 = "file-008";
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      assert.assertTrue(isFirstProofForFile(file1, dlp1));
      assert.assertTrue(isFirstProofForFile(file1, dlp2));
      assert.assertTrue(isFirstProofForFile(file2, dlp1));
      assert.assertTrue(isFirstProofForFile(file3, dlp2));

      assert.assertFalse(isFirstProofForFile(file1, dlp1));
      assert.assertFalse(isFirstProofForFile(file1, dlp2));
      assert.assertFalse(isFirstProofForFile(file2, dlp1));
      assert.assertFalse(isFirstProofForFile(file3, dlp2));

      assert.assertTrue(isFirstProofForFile(file2, dlp2));
      assert.assertTrue(isFirstProofForFile(file3, dlp1));
    });

    test("Should increment counter correctly", () => {
      const fileId = "file-009";
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const counterId = getFileDlpProofsCounterId(fileId, dlpAddress.toHexString());

      assert.i32Equals(0, getCounterValue(counterId));

      isFirstProofForFile(fileId, dlpAddress);
      assert.i32Equals(1, getCounterValue(counterId));

      isFirstProofForFile(fileId, dlpAddress);
      assert.i32Equals(2, getCounterValue(counterId));

      isFirstProofForFile(fileId, dlpAddress);
      assert.i32Equals(3, getCounterValue(counterId));
    });
  });

  describe("createProofFromEvent with new ID system", () => {
    test("Should create proof with composite ID", () => {
      const fileId = "file-100";
      const proofIndex = BigInt.fromI32(0);
      const score = BigInt.fromI32(100);
      const metadata = "test-metadata";
      const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");

      const user = getOrCreateUser(ownerAddress);
      const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1000000));

      const file = new File(fileId);
      file.owner = user.id;
      file.ownerAddress = ownerAddress;
      file.schemaId = BigInt.fromI32(1);
      file.save();

      const mockEvent = newMockEvent();
      const proof = createProofFromEvent(
        fileId,
        proofIndex,
        score,
        metadata,
        mockEvent.block,
        mockEvent.transaction
      );

      const expectedProofId = getProofId(fileId, proofIndex);
      assert.stringEquals(expectedProofId, proof.id);
      assert.fieldEquals("DataRegistryProof", expectedProofId, "id", expectedProofId);
      assert.fieldEquals("DataRegistryProof", expectedProofId, "file", fileId);
      assert.fieldEquals("DataRegistryProof", expectedProofId, "score", score.toString());
      assert.fieldEquals("DataRegistryProof", expectedProofId, "metadata", metadata);
    });

    test("Should create multiple proofs for same file with different indices", () => {
      const fileId = "file-101";
      const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

      const user = getOrCreateUser(ownerAddress);
      const file = new File(fileId);
      file.owner = user.id;
      file.ownerAddress = ownerAddress;
      file.schemaId = BigInt.fromI32(1);
      file.save();

      const mockEvent = newMockEvent();

      const proof1 = createProofFromEvent(
        fileId,
        BigInt.fromI32(0),
        BigInt.fromI32(100),
        "metadata-1",
        mockEvent.block,
        mockEvent.transaction
      );

      const proof2 = createProofFromEvent(
        fileId,
        BigInt.fromI32(1),
        BigInt.fromI32(200),
        "metadata-2",
        mockEvent.block,
        mockEvent.transaction
      );

      const proof3 = createProofFromEvent(
        fileId,
        BigInt.fromI32(2),
        BigInt.fromI32(300),
        "metadata-3",
        mockEvent.block,
        mockEvent.transaction
      );

      assert.stringEquals("file-file-101-proof-0", proof1.id);
      assert.stringEquals("file-file-101-proof-1", proof2.id);
      assert.stringEquals("file-file-101-proof-2", proof3.id);

      assert.entityCount("DataRegistryProof", 3);
    });

    test("Should link proof to file entity correctly", () => {
      const fileId = "file-102";
      const proofIndex = BigInt.fromI32(0);
      const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

      const user = getOrCreateUser(ownerAddress);
      const file = new File(fileId);
      file.owner = user.id;
      file.ownerAddress = ownerAddress;
      file.schemaId = BigInt.fromI32(1);
      file.save();

      const mockEvent = newMockEvent();
      const proof = createProofFromEvent(
        fileId,
        proofIndex,
        BigInt.fromI32(100),
        "test",
        mockEvent.block,
        mockEvent.transaction
      );

      const loadedProof = DataRegistryProof.load(proof.id);
      assert.assertNotNull(loadedProof);
      assert.stringEquals(fileId, loadedProof!.file);
    });

    test("Should handle proofs for non-existent files gracefully", () => {
      const fileId = "non-existent-file";
      const proofIndex = BigInt.fromI32(0);
      const mockEvent = newMockEvent();

      const proof = createProofFromEvent(
        fileId,
        proofIndex,
        BigInt.fromI32(100),
        "test",
        mockEvent.block,
        mockEvent.transaction
      );

      assert.stringEquals("file-non-existent-file-proof-0", proof.id);
      assert.stringEquals(fileId, proof.file);
    });

    test("Should preserve all proof metadata with new ID system", () => {
      const fileId = "file-103";
      const proofIndex = BigInt.fromI32(5);
      const score = BigInt.fromI32(999);
      const metadata = "complex-metadata-with-special-chars-!@#$%";
      const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

      const user = getOrCreateUser(ownerAddress);
      const file = new File(fileId);
      file.owner = user.id;
      file.ownerAddress = ownerAddress;
      file.schemaId = BigInt.fromI32(10);
      file.save();

      const mockEvent = newMockEvent();
      const proof = createProofFromEvent(
        fileId,
        proofIndex,
        score,
        metadata,
        mockEvent.block,
        mockEvent.transaction
      );

      const expectedId = getProofId(fileId, proofIndex);
      const loadedProof = DataRegistryProof.load(expectedId);

      assert.assertNotNull(loadedProof);
      assert.stringEquals(expectedId, loadedProof!.id);
      assert.stringEquals(fileId, loadedProof!.file);
      assert.bigIntEquals(score, loadedProof!.score);
      assert.stringEquals(metadata, loadedProof!.metadata);
      assert.bigIntEquals(mockEvent.block.number, loadedProof!.addedAtBlock);
      assert.bigIntEquals(mockEvent.block.timestamp, loadedProof!.addedAtTimestamp);
      assert.stringEquals(mockEvent.transaction.hash.toHexString(), loadedProof!.transactionHash.toHexString());
    });
  });

  describe("Counter integration with proof handlers", () => {
    test("Should only increment counter on first proof", () => {
      const fileId = "file-200";
      const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000001");
      const counterId = getFileDlpProofsCounterId(fileId, dlpAddress.toHexString());

      assert.i32Equals(0, getCounterValue(counterId));

      const first = isFirstProofForFile(fileId, dlpAddress);
      assert.assertTrue(first);
      assert.i32Equals(1, getCounterValue(counterId));

      const second = isFirstProofForFile(fileId, dlpAddress);
      assert.assertFalse(second);
      assert.i32Equals(2, getCounterValue(counterId));
    });

    test("Should maintain separate counters for different file-DLP combinations", () => {
      const file1 = "file-201";
      const file2 = "file-202";
      const dlp1 = Address.fromString("0xabc0000000000000000000000000000000000001");
      const dlp2 = Address.fromString("0xdef0000000000000000000000000000000000002");

      const counter1 = getFileDlpProofsCounterId(file1, dlp1.toHexString());
      const counter2 = getFileDlpProofsCounterId(file1, dlp2.toHexString());
      const counter3 = getFileDlpProofsCounterId(file2, dlp1.toHexString());
      const counter4 = getFileDlpProofsCounterId(file2, dlp2.toHexString());

      isFirstProofForFile(file1, dlp1);
      isFirstProofForFile(file1, dlp1);
      isFirstProofForFile(file1, dlp2);
      isFirstProofForFile(file2, dlp1);
      isFirstProofForFile(file2, dlp1);
      isFirstProofForFile(file2, dlp1);
      isFirstProofForFile(file2, dlp2);

      assert.i32Equals(2, getCounterValue(counter1));
      assert.i32Equals(1, getCounterValue(counter2));
      assert.i32Equals(3, getCounterValue(counter3));
      assert.i32Equals(1, getCounterValue(counter4));
    });
  });
});