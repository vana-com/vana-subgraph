import { BigInt as GraphBigInt, log, Bytes } from "@graphprotocol/graph-ts";

import {
  DataRegistryProof,
  FileOwner,
  Epoch,
  DlpEpochUserContribution,
} from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV2/DataRegistryImplementationV2";
import {
  getOrCreateUserTotals,
  getUserTotalsId,
  getUserTotalsIdDlp,
} from "../../entity/usertotals";
import {
  getOrCreateTotals,
  getOrCreateTotalsForDlpEpoch,
  getTotalsIdDlp,
  TOTALS_ID_GLOBAL,
} from "../../entity/totals";
import { getEpochForBlock } from "../../entity/epoch";
import {getOrCreateDlp} from "../shared";

export function handleFileAddedV2(event: FileAddedEvent): void {
  log.info("Handling DataRegistry FileAdded with transaction hash: {}", [
    event.transaction.hash.toHex(),
  ]);

  const ownership = new FileOwner(event.params.fileId.toString());
  ownership.ownerAddress = event.params.ownerAddress;
  ownership.save();
}

export function handleDataRegistryProofAddedV2(event: FileProofAdded): void {
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
  const fileOwner = FileOwner.load(event.params.fileId.toString());
  if (fileOwner !== null) {
    const userId = fileOwner.ownerAddress.toHex();
    proof.user = userId;
  } else {
    log.warning(
      "File '{}' not found for data registry proof (could not set user id): {}",
      [event.params.fileId.toString(), proof.id],
    );
  }

  // Populate fields based on the event data
  proof.dlp = dlp.id;
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

  // Track unique contributors for this DLP in the current epoch
  const epoch = Epoch.load(epochId);
  if (epoch) {
    // Determine the eligibility start block (later of epoch start or DLP verification)
    let dlpVerificationBlock = GraphBigInt.zero();
    if (dlp.verificationBlockNumber) {
      dlpVerificationBlock = dlp.verificationBlockNumber as GraphBigInt;
    }
    const eligibilityStartBlock: GraphBigInt = epoch.startBlock.gt(dlpVerificationBlock) 
      ? epoch.startBlock 
      : dlpVerificationBlock;

    // Check if this is the user's first contribution to this DLP in this epoch after eligibility
    const hasContributedInEpoch = checkUserContributedInEpoch(
      userId,
      event.params.dlpId.toString(),
      epochId,
      eligibilityStartBlock,
      event.block.number
    );

    // Only update epoch-specific totals if contribution is after eligibility start
    if (event.block.number.ge(eligibilityStartBlock)) {
      const epochTotals = getOrCreateTotalsForDlpEpoch(
        event.params.dlpId.toString(),
        epochId
      );
      
      // Increment total file contributions for eligible contributions
      epochTotals.totalFileContributions = epochTotals.totalFileContributions.plus(
        GraphBigInt.fromI32(1)
      );
      
      // Only increment unique contributors on first eligible contribution
      if (!hasContributedInEpoch) {
        epochTotals.uniqueFileContributors = epochTotals.uniqueFileContributors.plus(
          GraphBigInt.fromI32(1)
        );
      }
      
      epochTotals.save();
    }
  }
}

function checkUserContributedInEpoch(
  userId: string,
  dlpId: string,
  epochId: string,
  eligibilityStartBlock: GraphBigInt,
  currentBlock: GraphBigInt
): boolean {
  // Only count contributions at or after the eligibility start block
  if (currentBlock.lt(eligibilityStartBlock)) {
    return true; // Contribution is before eligibility, don't count as unique
  }

  // Use tracking entity to check if user has contributed to this DLP in this epoch after eligibility
  const trackingId = `${userId}-${dlpId}-${epochId}`;
  
  // Check if tracking entity exists
  let userEpochContribution = DlpEpochUserContribution.load(trackingId);
  if (!userEpochContribution) {
    // This is the first eligible contribution - create tracking entity
    userEpochContribution = new DlpEpochUserContribution(trackingId);
    userEpochContribution.user = Bytes.fromHexString(userId);
    userEpochContribution.dlp = Bytes.fromUTF8(dlpId);
    userEpochContribution.epoch = Bytes.fromUTF8(epochId);
    userEpochContribution.firstContributionBlock = currentBlock;
    userEpochContribution.save();
    
    return false; // First eligible contribution in this epoch
  }
  
  // Check if the existing contribution was before eligibility start
  if (userEpochContribution.firstContributionBlock.lt(eligibilityStartBlock)) {
    // Previous contribution was before eligibility, update with current contribution
    userEpochContribution.firstContributionBlock = currentBlock;
    userEpochContribution.save();
    return false; // First eligible contribution in this epoch
  }
  
  return true; // User has already made an eligible contribution in this epoch
}
