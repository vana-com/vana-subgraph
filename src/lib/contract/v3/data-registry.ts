import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";

import {
  DataRegistryProof,
  Dlp,
  EpochReference,
  FileOwner,
} from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV3/DataRegistryImplementationV3";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../entity/epoch";
import {
  getOrCreateUserTotals,
  getUserTotalsId,
  getUserTotalsIdDlp,
} from "../../entity/usertotals";
import {
  getOrCreateTotals,
  getTotalsIdDlp,
  TOTALS_ID_GLOBAL,
} from "../../entity/totals";
import {getOrCreateDlp, getOrCreateUser} from "../shared";
import { getEpochForBlock } from "../../entity/epoch";

export function handleFileAddedV3(event: FileAddedEvent): void {
  log.info("Handling DataRegistry FileAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  const ownership = new FileOwner(event.params.fileId.toString());
  ownership.ownerAddress = event.params.ownerAddress;
  ownership.save();
}

export function handleDataRegistryProofAddedV3(event: FileProofAdded): void {
  log.info("Handling DataRegistry ProofAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  // Get epoch for the current block
  const epochId = getEpochForBlock(event.block.number);
  if (!epochId) {
    log.error("No epoch found for block {}", [event.block.number.toString()]);
    return;
  }

  // Ensure the Dlp entity exists
  const dlp = getOrCreateDlp(event.params.dlpId.toString());

  // Create a new DataRegistryProof entity
  const proof = new DataRegistryProof(event.transaction.hash.toHex());

  // Load File
  const fileId = event.params.fileId;
  const userId = event.params.ownerAddress.toHex();

  // Ensure the User entity exists
  getOrCreateUser(userId);

  // Store proof based on the event data
  proof.user = userId;
  proof.dlp = dlp.id;
  proof.epoch = epochId;
  proof.fileId = fileId;
  proof.proofIndex = event.params.proofIndex;
  proof.createdAt = event.block.timestamp;
  proof.createdAtBlock = event.block.number;
  proof.createdTxHash = event.transaction.hash;
  proof.save();

  // Update user totals
  const userTotalsId = getUserTotalsId(userId);
  const userTotals = getOrCreateUserTotals(userTotalsId);
  userTotals.fileContributionsCount = userTotals.fileContributionsCount.plus(
    GraphBigInt.fromI32(1),
  );
  userTotals.save();

  // Update global unique file contribution totals
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

  // Create or load dlp user totals
  const dlpUserTotalsId = getUserTotalsIdDlp(
    userId,
    event.params.dlpId.toString(),
  );
  const dlpUserTotals = getOrCreateUserTotals(dlpUserTotalsId);
  dlpUserTotals.fileContributionsCount =
    dlpUserTotals.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  dlpUserTotals.save();

  // Update dlp file contribution totals
  const dlpTotalsId = getTotalsIdDlp(event.params.dlpId.toString());
  const dlpTotals = getOrCreateTotals(dlpTotalsId);
  dlpTotals.totalFileContributions = dlpTotals.totalFileContributions.plus(
    GraphBigInt.fromI32(1),
  );
  if (dlpUserTotals.fileContributionsCount.toI32() === 1) {
    dlpTotals.uniqueFileContributors = dlpTotals.uniqueFileContributors.plus(
      GraphBigInt.fromI32(1),
    );
  }
  dlpTotals.save();
}
