import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  DlpRegistered,
  DlpUpdated,
  DlpStatusUpdated,
  DlpVerificationUpdated,
  DlpTokenUpdated,
  DlpRegistrationDepositAmountUpdated,
} from "../../../../generated/DLPRegistryImplementationV5/DLPRegistryImplementationV5";

import { Dlp } from "../../../../generated/schema";
import { getTotalsIdDlp } from "../../entity/totals/constants";
import { getOrCreateDlpList } from "../../../../src/lib/entity/dlp-list";
import { getOrCreateTotals } from "../../entity/totals";
import {getOrCreateDlp, getOrCreateUser} from "../shared";

// Mirrored from DLPRegistry.IDLPRegistry.DlpStatus
enum dlpStatus {
  NONE = 0,
  REGISTERED = 1,
  ELIGIBLE = 2,
  DEREGISTERED = 3,
}

export function handleDlpRegisteredV5(event: DlpRegistered): void {
  log.info("Handling DlpRegistered with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const dlpId = event.params.dlpId.toString();

  // Ensure User entities exist for creator and owner
  getOrCreateUser(event.transaction.from.toHex());
  getOrCreateUser(event.params.ownerAddress.toHex());

  const dlp = getOrCreateDlp(event.params.dlpId.toString());

  dlp.creator = event.transaction.from;
  dlp.owner = event.params.ownerAddress;
  dlp.address = event.params.dlpAddress;
  dlp.treasury = event.params.treasuryAddress;
  dlp.name = event.params.name;
  dlp.iconUrl = event.params.iconUrl;
  dlp.website = event.params.website;
  dlp.metadata = event.params.metadata;
  dlp.createdAt = event.block.timestamp;
  dlp.createdTxHash = event.transaction.hash;
  dlp.createdAtBlock = event.block.number;
  dlp.status = BigInt.fromI32(dlpStatus.REGISTERED);

  // New field in v5
  dlp.isVerified = false;

  // Keep staking fields for backward compatibility but set to zero
  dlp.performanceRating = BigInt.zero();

  dlp.save();

  // Add to DLP list
  const dlpList = getOrCreateDlpList();
  const dlpIds = dlpList.dlpIds;
  if (!dlpIds.includes(dlpId)) {
    const newDlpIds = dlpIds;
    newDlpIds.push(dlpId);
    dlpList.dlpIds = newDlpIds;
    dlpList.save();
  }
}

export function handleDlpUpdatedV5(event: DlpUpdated): void {
  log.info("Handling DlpUpdated with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const dlpId = event.params.dlpId.toString();
  const dlp = Dlp.load(dlpId);

  if (dlp != null) {
    // Ensure User entity exists for the new owner
    getOrCreateUser(event.params.ownerAddress.toHex());

    dlp.owner = event.params.ownerAddress;
    dlp.address = event.params.dlpAddress;
    dlp.treasury = event.params.treasuryAddress;
    dlp.name = event.params.name;
    dlp.iconUrl = event.params.iconUrl;
    dlp.website = event.params.website;
    dlp.metadata = event.params.metadata;
    dlp.save();
  } else {
    log.error("DLP not found during update: {}", [dlpId]);
  }
}

export function handleDlpStatusUpdatedV5(event: DlpStatusUpdated): void {
  log.info("Handling DlpStatusUpdated with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const dlpId = event.params.dlpId.toString();
  const dlp = Dlp.load(dlpId);

  if (dlp != null) {
    const newStatus = event.params.newStatus;
    dlp.status = BigInt.fromI32(newStatus);

    // Track eligibility transitions
    if (newStatus === dlpStatus.ELIGIBLE) {
      dlp.isRewardEligible = true;
      dlp.rewardEligibleAt = event.block.timestamp;
      dlp.rewardEligibleAtBlock = event.block.number;
    } else {
      dlp.isRewardEligible = false;
    }

    dlp.save();
  } else {
    log.error("DLP not found during status update: {}", [dlpId]);
  }
}

export function handleDlpVerificationUpdatedV5(
  event: DlpVerificationUpdated,
): void {
  log.info("Handling DlpVerificationUpdated with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const dlpId = event.params.dlpId.toString();
  const dlp = Dlp.load(dlpId);

  if (dlp != null) {
    dlp.isVerified = event.params.verified;
    dlp.save();

    // Update status based on verification and token status
    let isEligible = false;
    if (dlp.isVerified) {
      if (!(dlp.token === null)) {
        isEligible = true;
      }
    }

    if (isEligible) {
      dlp.status = BigInt.fromI32(dlpStatus.ELIGIBLE);
    } else {
      dlp.status = BigInt.fromI32(dlpStatus.REGISTERED);
    }
    dlp.save();
  } else {
    log.error("DLP not found during verification update: {}", [dlpId]);
  }
}

export function handleDlpTokenUpdatedV5(event: DlpTokenUpdated): void {
  log.info("Handling DlpTokenUpdated with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  // Ensure the Dlp entity exists
  const dlp = getOrCreateDlp(event.params.dlpId.toString());

  dlp.token = event.params.tokenAddress;
  dlp.save();

  // Update status based on verification and token status
  let isEligible = false;
  if (dlp.isVerified) {
    if (!(dlp.token === null)) {
      isEligible = true;
    }
  }

  if (isEligible) {
    dlp.status = BigInt.fromI32(dlpStatus.ELIGIBLE);
  } else {
    dlp.status = BigInt.fromI32(dlpStatus.REGISTERED);
  }
  dlp.save();
}

export function handleDlpRegistrationDepositAmountUpdatedV5(
  event: DlpRegistrationDepositAmountUpdated,
): void {
  log.info("handleDlpRegistrationDepositAmountUpdatedV5: {}", [
    event.transaction.hash.toHexString(),
  ]);
  // No state changes needed for deposit amount updates
}
