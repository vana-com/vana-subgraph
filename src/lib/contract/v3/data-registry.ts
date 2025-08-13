import { BigInt as GraphBigInt, log } from "@graphprotocol/graph-ts";

import { Epoch, PerformanceDlpEpochUser } from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV3/DataRegistryImplementationV3";
import { getOrCreateTotalsForDlpEpochPerformance } from "../../entity/totals";
import { getEpochForBlock } from "../../entity/epoch";
import { getDlpEpochUserId } from "../../entity/dlpEpochUser";
import {
  getOrCreateDlp,
  getOrCreateUser,
  createFileFromEvent,
  logDataRegistryEvent,
  createDataRegistryProof,
  updateAllTotals,
  ERROR_NO_EPOCH,
  DEFAULT_SCHEMA_ID,
  ONE,
} from "../shared/index";

export function handleFileAddedV3(event: FileAddedEvent): void {
  logDataRegistryEvent("FileAdded", event.transaction.hash.toHex());

  // Create file entity using shared utility
  // V3 of the contract does not support schemaId, so we use default (0)
  createFileFromEvent(
    event.params.fileId.toString(),
    event.params.ownerAddress.toHex(),
    event.params.url,
    event.block,
    event.transaction,
    DEFAULT_SCHEMA_ID,
  );
}

export function handleDataRegistryProofAddedV3(event: FileProofAdded): void {
  logDataRegistryEvent("ProofAdded", event.transaction.hash.toHex());

  const epochId = getEpochForBlock(event.block.number);
  // Check for "-1" explicitly, as it is a truthy string
  if (epochId == "-1") {
    log.error(ERROR_NO_EPOCH + " {}", [event.block.number.toString()]);
    return;
  }

  const userId = event.params.ownerAddress.toHex();
  const dlpId = event.params.dlpId.toString();

  const dlp = getOrCreateDlp(dlpId);
  getOrCreateUser(userId);

  // Create proof using shared utility
  // V3 has both user and DLP associations in the proof
  createDataRegistryProof(
    event.transaction.hash.toHex(),
    epochId,
    event.params.fileId,
    event.params.proofIndex,
    event.block,
    event.transaction,
    userId,
    dlp.id,
  );

  // Update totals using shared utility
  updateAllTotals(userId, dlpId);

  // Update DLP epoch user (V3 specific functionality)
  updateDlpEpochUser(event, epochId, userId, dlpId);
}

// Removed: now using shared createDataRegistryProof function

// Removed: now using shared updateAllTotals function

function updateDlpEpochUser(
  event: FileProofAdded,
  epochId: string,
  userId: string,
  dlpId: string,
): void {
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

  if (!event.block.number.ge(eligibilityStartBlock)) {
    return;
  }

  const id = getDlpEpochUserId(dlpId, epochId, userId);
  let dlpEpochUser = PerformanceDlpEpochUser.load(id);

  let firstContributionInEpoch = false;
  if (dlpEpochUser == null) {
    firstContributionInEpoch = true;

    dlpEpochUser = new PerformanceDlpEpochUser(id);
    dlpEpochUser.save();
  }

  const dlpEpochTotals = getOrCreateTotalsForDlpEpochPerformance(
    dlpId,
    epochId,
  );
  dlpEpochTotals.totalFileContributions =
    dlpEpochTotals.totalFileContributions.plus(ONE);

  if (firstContributionInEpoch) {
    dlpEpochTotals.uniqueFileContributors =
      dlpEpochTotals.uniqueFileContributors.plus(ONE);
  }

  dlpEpochTotals.save();
}
