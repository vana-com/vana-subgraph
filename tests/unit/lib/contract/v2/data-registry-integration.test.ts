import { afterEach, describe, test } from "matchstick-as/assembly/index";
import { assert } from "matchstick-as/assembly/assert";
import { clearStore } from "@graphprotocol/graph-ts";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { ProofAdded } from "../../../../../generated/DataRegistryV2/DataRegistryV2";
import { DataRegistryProof, File, Totals, Schema } from "../../../../../generated/schema";
import { handleProofAdded } from "../../../../../src/lib/contract/v2/data-registry";
import { getOrCreateUser } from "../../../../../src/lib/entity/user";
import { getOrCreateDlp } from "../../../../../src/lib/entity/dlp";
import { getOrCreateTotals } from "../../../../../src/lib/entity/totals/totals";
import { getProofId, isFirstProofForFile } from "../../../../../src/lib/contract/shared/proof-handlers";
import { getCounterValue, getFileDlpProofsCounterId } from "../../../../../src/lib/entity/counter";

describe("DataRegistry V2 Integration - New Proof Handling", () => {
  afterEach(() => {
    clearStore();
  });

  function createProofAddedEvent(
    fileId: BigInt,
    proofIndex: BigInt,
    score: BigInt,
    metadata: string,
    dlpAddress: Address
  ): ProofAdded {
    const mockEvent = newMockEvent();
    const event = changetype<ProofAdded>(mockEvent);

    event.parameters = [];
    event.parameters.push(
      new ethereum.EventParam("fileId", ethereum.Value.fromUnsignedBigInt(fileId))
    );
    event.parameters.push(
      new ethereum.EventParam("proofIndex", ethereum.Value.fromUnsignedBigInt(proofIndex))
    );
    event.parameters.push(
      new ethereum.EventParam("score", ethereum.Value.fromUnsignedBigInt(score))
    );
    event.parameters.push(
      new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata))
    );

    event.address = dlpAddress;

    return event;
  }

  test("Should create proof with composite ID in V2", () => {
    const fileId = BigInt.fromI32(100);
    const proofIndex = BigInt.fromI32(0);
    const score = BigInt.fromI32(500);
    const metadata = "v2-test-metadata";
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = BigInt.fromI32(5);
    file.save();

    const event = createProofAddedEvent(fileId, proofIndex, score, metadata, dlpAddress);
    handleProofAdded(event);

    const expectedProofId = getProofId(fileId.toString(), proofIndex);
    const proof = DataRegistryProof.load(expectedProofId);

    assert.assertNotNull(proof);
    assert.stringEquals(expectedProofId, proof!.id);
    assert.stringEquals(fileId.toString(), proof!.file);
    assert.bigIntEquals(score, proof!.score);
    assert.stringEquals(metadata, proof!.metadata);
  });

  test("Should only update totals on first proof for file in V2", () => {
    const fileId = BigInt.fromI32(101);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");
    const schemaId = BigInt.fromI32(10);

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));
    const totals = getOrCreateTotals(dlpAddress);
    totals.filesValidated = BigInt.fromI32(0);
    totals.totalFilesWithSchema = BigInt.fromI32(0);
    totals.save();

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = BigInt.fromI32(0);
    schema.uniqueContributorsCount = BigInt.fromI32(0);
    schema.save();

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = schemaId;
    file.save();

    const event1 = createProofAddedEvent(fileId, BigInt.fromI32(0), BigInt.fromI32(100), "metadata-1", dlpAddress);
    handleProofAdded(event1);

    let updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.filesValidated);
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);

    const event2 = createProofAddedEvent(fileId, BigInt.fromI32(1), BigInt.fromI32(200), "metadata-2", dlpAddress);
    handleProofAdded(event2);

    updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.filesValidated);
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);

    const event3 = createProofAddedEvent(fileId, BigInt.fromI32(2), BigInt.fromI32(300), "metadata-3", dlpAddress);
    handleProofAdded(event3);

    updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.filesValidated);
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);
  });

  test("Should track proofs independently for different files in V2", () => {
    const file1Id = BigInt.fromI32(102);
    const file2Id = BigInt.fromI32(103);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));
    const totals = getOrCreateTotals(dlpAddress);
    totals.filesValidated = BigInt.fromI32(0);
    totals.save();

    const file1 = new File(file1Id.toString());
    file1.owner = user.id;
    file1.ownerAddress = ownerAddress;
    file1.schemaId = BigInt.fromI32(1);
    file1.save();

    const file2 = new File(file2Id.toString());
    file2.owner = user.id;
    file2.ownerAddress = ownerAddress;
    file2.schemaId = BigInt.fromI32(1);
    file2.save();

    const event1 = createProofAddedEvent(file1Id, BigInt.fromI32(0), BigInt.fromI32(100), "file1-proof1", dlpAddress);
    handleProofAdded(event1);

    const event2 = createProofAddedEvent(file2Id, BigInt.fromI32(0), BigInt.fromI32(200), "file2-proof1", dlpAddress);
    handleProofAdded(event2);

    const event3 = createProofAddedEvent(file1Id, BigInt.fromI32(1), BigInt.fromI32(150), "file1-proof2", dlpAddress);
    handleProofAdded(event3);

    const updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.bigIntEquals(BigInt.fromI32(2), updatedTotals!.filesValidated);

    assert.entityCount("DataRegistryProof", 3);

    const proof1 = DataRegistryProof.load(getProofId(file1Id.toString(), BigInt.fromI32(0)));
    const proof2 = DataRegistryProof.load(getProofId(file2Id.toString(), BigInt.fromI32(0)));
    const proof3 = DataRegistryProof.load(getProofId(file1Id.toString(), BigInt.fromI32(1)));

    assert.assertNotNull(proof1);
    assert.assertNotNull(proof2);
    assert.assertNotNull(proof3);
  });

  test("Should increment counter correctly for multiple proofs in V2", () => {
    const fileId = BigInt.fromI32(104);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = BigInt.fromI32(1);
    file.save();

    const counterId = getFileDlpProofsCounterId(fileId.toString(), dlpAddress.toHexString());

    assert.i32Equals(0, getCounterValue(counterId));

    const event1 = createProofAddedEvent(fileId, BigInt.fromI32(0), BigInt.fromI32(100), "proof-1", dlpAddress);
    handleProofAdded(event1);
    assert.i32Equals(1, getCounterValue(counterId));

    const event2 = createProofAddedEvent(fileId, BigInt.fromI32(1), BigInt.fromI32(200), "proof-2", dlpAddress);
    handleProofAdded(event2);
    assert.i32Equals(2, getCounterValue(counterId));

    const event3 = createProofAddedEvent(fileId, BigInt.fromI32(2), BigInt.fromI32(300), "proof-3", dlpAddress);
    handleProofAdded(event3);
    assert.i32Equals(3, getCounterValue(counterId));
  });

  test("Should track schema contributions correctly in V2", () => {
    const fileId = BigInt.fromI32(105);
    const schemaId = BigInt.fromI32(15);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));
    const totals = getOrCreateTotals(dlpAddress);
    totals.totalFilesWithSchema = BigInt.fromI32(0);
    totals.uniqueFileContributorsWithSchema = BigInt.fromI32(0);
    totals.save();

    const schema = new Schema(schemaId.toString());
    schema.schemaId = schemaId;
    schema.contributionsCount = BigInt.fromI32(0);
    schema.uniqueContributorsCount = BigInt.fromI32(0);
    schema.save();

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = schemaId;
    file.save();

    const event = createProofAddedEvent(fileId, BigInt.fromI32(0), BigInt.fromI32(100), "metadata", dlpAddress);
    handleProofAdded(event);

    const updatedTotals = Totals.load(dlpAddress.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.totalFilesWithSchema);
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals!.uniqueFileContributorsWithSchema);
  });

  test("Should handle multiple DLPs independently in V2", () => {
    const fileId = BigInt.fromI32(106);
    const dlp1Address = Address.fromString("0xabc0000000000000000000000000000000000002");
    const dlp2Address = Address.fromString("0xdef0000000000000000000000000000000000003");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp1 = getOrCreateDlp(dlp1Address, BigInt.fromI32(1283121));
    const dlp2 = getOrCreateDlp(dlp2Address, BigInt.fromI32(1283121));

    const totals1 = getOrCreateTotals(dlp1Address);
    totals1.filesValidated = BigInt.fromI32(0);
    totals1.save();

    const totals2 = getOrCreateTotals(dlp2Address);
    totals2.filesValidated = BigInt.fromI32(0);
    totals2.save();

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = BigInt.fromI32(1);
    file.save();

    const event1 = createProofAddedEvent(fileId, BigInt.fromI32(0), BigInt.fromI32(100), "dlp1-proof1", dlp1Address);
    handleProofAdded(event1);

    const event2 = createProofAddedEvent(fileId, BigInt.fromI32(0), BigInt.fromI32(200), "dlp2-proof1", dlp2Address);
    handleProofAdded(event2);

    const event3 = createProofAddedEvent(fileId, BigInt.fromI32(1), BigInt.fromI32(150), "dlp1-proof2", dlp1Address);
    handleProofAdded(event3);

    const updatedTotals1 = Totals.load(dlp1Address.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals1!.filesValidated);

    const updatedTotals2 = Totals.load(dlp2Address.toHexString());
    assert.bigIntEquals(BigInt.fromI32(1), updatedTotals2!.filesValidated);

    const counter1 = getFileDlpProofsCounterId(fileId.toString(), dlp1Address.toHexString());
    const counter2 = getFileDlpProofsCounterId(fileId.toString(), dlp2Address.toHexString());

    assert.i32Equals(2, getCounterValue(counter1));
    assert.i32Equals(1, getCounterValue(counter2));
  });

  test("Should correctly link proofs to files with new ID system in V2", () => {
    const fileId = BigInt.fromI32(107);
    const dlpAddress = Address.fromString("0xabc0000000000000000000000000000000000002");
    const ownerAddress = Address.fromString("0x1234567890123456789012345678901234567890");

    const user = getOrCreateUser(ownerAddress);
    const dlp = getOrCreateDlp(dlpAddress, BigInt.fromI32(1283121));

    const file = new File(fileId.toString());
    file.owner = user.id;
    file.ownerAddress = ownerAddress;
    file.schemaId = BigInt.fromI32(1);
    file.save();

    const proofIndices = [0, 1, 2, 3, 4];
    for (let i = 0; i < proofIndices.length; i++) {
      const event = createProofAddedEvent(
        fileId,
        BigInt.fromI32(proofIndices[i]),
        BigInt.fromI32(100 * (i + 1)),
        `proof-${i}`,
        dlpAddress
      );
      handleProofAdded(event);
    }

    assert.entityCount("DataRegistryProof", 5);

    for (let i = 0; i < proofIndices.length; i++) {
      const proofId = getProofId(fileId.toString(), BigInt.fromI32(proofIndices[i]));
      const proof = DataRegistryProof.load(proofId);
      assert.assertNotNull(proof);
      assert.stringEquals(fileId.toString(), proof!.file);
      assert.bigIntEquals(BigInt.fromI32(100 * (i + 1)), proof!.score);
    }
  });
});