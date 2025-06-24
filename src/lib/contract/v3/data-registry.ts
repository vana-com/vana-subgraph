import {BigInt as GraphBigInt, Bytes, log} from "@graphprotocol/graph-ts";

import {
  DataRegistryProof,
  Epoch,
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
  getOrCreateTotals, getOrCreateTotalsForDlpEpochPerformance,
  getTotalsDlpId,
  TOTALS_ID_GLOBAL,
} from "../../entity/totals";
import {getOrCreateDlp, getOrCreateUser} from "../shared";
import { getEpochForBlock } from "../../entity/epoch";
import {getOrCreateDlpEpochUser} from "../../entity/dlpEpochUser";

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

  const epochId = getEpochForBlock(event.block.number);
  if (!epochId) {
    log.error("No epoch found for block {}", [event.block.number.toString()]);
    return;
  }

  const userId = event.params.ownerAddress.toHex();
  const dlpId = event.params.dlpId.toString();

  const dlp = getOrCreateDlp(dlpId);
  getOrCreateUser(userId);

  createDataRegistryProof(event, epochId, dlp.id, userId);
  updateTotals(userId, dlpId);
  updateDlpEpochUser(event, epochId, userId, dlpId);
}

function createDataRegistryProof(
    event: FileProofAdded,
    epochId: string,
    dlpId: string,
    userId: string,
): void {
  const proof = new DataRegistryProof(event.transaction.hash.toHex());
  proof.user = userId;
  proof.dlp = dlpId;
  proof.epoch = epochId;
  proof.fileId = event.params.fileId;
  proof.proofIndex = event.params.proofIndex;
  proof.createdAt = event.block.timestamp;
  proof.createdAtBlock = event.block.number;
  proof.createdTxHash = event.transaction.hash;
  proof.save();
}

function updateTotals(userId: string, dlpId: string): void {
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
      dlpId,
  );
  const dlpUserTotals = getOrCreateUserTotals(dlpUserTotalsId);
  dlpUserTotals.fileContributionsCount =
      dlpUserTotals.fileContributionsCount.plus(GraphBigInt.fromI32(1));
  dlpUserTotals.save();

  // Update dlp file contribution totals
  const dlpTotalsId = getTotalsDlpId(dlpId);
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

function updateDlpEpochUser(
    event: FileProofAdded,
    epochId: string,
    userId: string,
    dlpId: string,
): void {
  const dlpEpochUser = getOrCreateDlpEpochUser(dlpId, epochId, userId);
  dlpEpochUser.lastContributionBlock = event.block.number;
  dlpEpochUser.fileContributionsCount = dlpEpochUser.fileContributionsCount.plus(
      GraphBigInt.fromI32(1),
  );
  dlpEpochUser.save();

  const epoch = Epoch.load(epochId);
  const dlp = getOrCreateDlp(dlpId);
  if (!epoch) {
    log.error("No epoch found for ID {}", [epochId]);
    return;
  }

  if (!dlp.verificationBlockNumber) {
    return;
  }

  const verificationBlock = dlp.verificationBlockNumber!;

  const eligibilityStartBlock = epoch.startBlock.gt(verificationBlock)
      ? epoch.startBlock
      : verificationBlock;

  if (!event.block.number.ge(eligibilityStartBlock)) return;

  const dlpEpochTotals = getOrCreateTotalsForDlpEpochPerformance(dlpId, epochId);
  dlpEpochTotals.totalFileContributions = dlpEpochTotals.totalFileContributions.plus(
      GraphBigInt.fromI32(1),
  );

  if (dlpEpochUser.fileContributionsCount.toI32() === 1) {
    dlpEpochTotals.uniqueFileContributors = dlpEpochTotals.uniqueFileContributors.plus(
        GraphBigInt.fromI32(1),
    );
  }

  dlpEpochTotals.save();
}