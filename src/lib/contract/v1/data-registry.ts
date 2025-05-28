import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";

import {
  DataRegistryProof,
  EpochReference,
  FileOwner,
} from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV1/DataRegistryImplementationV1";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../entity/epoch";
import {
  getOrCreateUserTotals,
  getUserTotalsId,
} from "../../entity/usertotals";
import { getOrCreateTotals, TOTALS_ID_GLOBAL } from "../../entity/totals";
import { getEpochForBlock } from "../../entity/epoch";

export function handleFileAddedV1(event: FileAddedEvent): void {
  log.info("Handling DataRegistry FileAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  const ownership = new FileOwner(event.params.fileId.toString());
  ownership.ownerAddress = event.params.ownerAddress;
  ownership.save();
}

export function handleDataRegistryProofAddedV1(event: FileProofAdded): void {
  log.info("Handling DataRegistry ProofAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  // Get epoch for the current block
  const epochId = getEpochForBlock(event.block.number);
  if (!epochId) {
    log.error("No epoch found for block {}", [event.block.number.toString()]);
    return;
  }

  // Create a new DataRegistryProof entity
  const proof = new DataRegistryProof(event.transaction.hash.toHex());

  // Load File
  const fileOwner = FileOwner.load(event.params.fileId.toString());
  if (fileOwner !== null) {
    const userId = fileOwner.ownerAddress.toHex();
    proof.user = userId;
  } else {
    log.error("File ownership '{}' not found for data registry proof: {}", [
      event.params.fileId.toString(),
      proof.id,
    ]);
  }

  // Populate fields based on the event data
  proof.epoch = epochId;
  proof.fileId = event.params.fileId;
  proof.proofIndex = event.params.proofIndex;
  proof.createdAt = event.block.timestamp;
  proof.createdAtBlock = event.block.number;
  proof.createdTxHash = event.transaction.hash;

  // Save the proof to the store
  proof.save();

  if (!fileOwner) {
    return;
  }
  const userId = fileOwner.ownerAddress.toHex();

  // Update user totals
  const userTotalsId = getUserTotalsId(userId);
  const userTotals = getOrCreateUserTotals(userTotalsId);
  userTotals.fileContributionsCount = userTotals.fileContributionsCount.plus(
    GraphBigInt.fromI32(1),
  );
  userTotals.save();

  // Update global file contribution totals
  const totals = getOrCreateTotals(TOTALS_ID_GLOBAL);
  totals.totalFileContributions = totals.totalFileContributions.plus(
    GraphBigInt.fromI32(1),
  );
  if (userTotals.fileContributionsCount.toI32() === 1) {
    totals.uniqueFileContributors = totals.uniqueFileContributors.plus(
      GraphBigInt.fromI32(1),
    );
  }
  totals.save();
}
