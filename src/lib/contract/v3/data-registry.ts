import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";

import {
  DataRegistryProof,
  Dlp,
  File,
  FileOwner,
} from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV3/DataRegistryImplementationV3";
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
import { getOrCreateUser } from "../shared";
import { getEpochForBlock } from "../../entity/epoch";

export function handleFileAddedV3(event: FileAddedEvent): void {
  log.info("Handling DataRegistry FileAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  // Create user entity if it doesn't exist
  const user = getOrCreateUser(event.params.ownerAddress.toHex());

  // Create new File entity
  const file = new File(event.params.fileId.toString());
  file.owner = user.id;
  file.url = event.params.url;
  file.addedAtBlock = event.block.number;
  file.addedAtTimestamp = event.block.timestamp;
  file.transactionHash = event.transaction.hash;

  // V3 of the contract does not support schemaId, so we set it to 0
  file.schemaId = GraphBigInt.fromI32(0);

  file.save();

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
  // Check for "-1" explicitly, as it is a truthy string
  if (epochId == "-1") {
    log.error("No epoch found for block {}", [event.block.number.toString()]);
    return;
  }

  // Load DLP instead of creating it to handle non-existent DLP case gracefully
  const dlp = Dlp.load(event.params.dlpId.toString());
  if (dlp == null) {
    log.error("DLP not found for proof: {}", [event.params.dlpId.toString()]);
    return;
  }

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
