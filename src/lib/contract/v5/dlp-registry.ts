import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  DlpRegistered,
  DlpUpdated,
  DlpStatusUpdated,
  DlpVerificationBlockUpdated,
  DlpTokenUpdated,
} from "../../../../generated/DLPRegistryImplementationV5/DLPRegistryImplementationV5";

import { Dlp } from "../../../../generated/schema";
import { getOrCreateDlpList } from "../../../../src/lib/entity/dlp-list";
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
  dlp.verificationBlockNumber = BigInt.zero();

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

    dlp.save();
  } else {
    log.error("DLP not found during status update: {}", [dlpId]);
  }
}

export function handleDlpVerificationBlockUpdatedV5(
  event: DlpVerificationBlockUpdated,
): void {
  log.info("Handling DlpVerificationBlockUpdated with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const dlpId = event.params.dlpId.toString();
  const dlp = Dlp.load(dlpId);

  if (dlp != null) {
    dlp.verificationBlockNumber = event.params.verificationBlockNumber;
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
}
