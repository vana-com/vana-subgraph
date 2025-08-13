import { log } from "@graphprotocol/graph-ts";

import { Dlp, File } from "../../../../generated/schema";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV2/DataRegistryImplementationV2";
import { getEpochForBlock } from "../../entity/epoch";
import {
  createFileFromEvent,
  logDataRegistryEvent,
  createDataRegistryProof,
  updateAllTotals,
  ERROR_NO_EPOCH,
  ERROR_DLP_NOT_FOUND,
  DEFAULT_SCHEMA_ID,
} from "../shared/index";

export function handleFileAddedV2(event: FileAddedEvent): void {
  logDataRegistryEvent("FileAdded", event.transaction.hash.toHex());

  // Create file entity using shared utility
  // V2 of the contract does not support schemaId, so we use default (0)
  createFileFromEvent(
    event.params.fileId.toString(),
    event.params.ownerAddress.toHex(),
    event.params.url,
    event.block,
    event.transaction,
    DEFAULT_SCHEMA_ID,
  );
}

export function handleDataRegistryProofAddedV2(event: FileProofAdded): void {
  logDataRegistryEvent("ProofAdded", event.transaction.hash.toHex());

  // Get epoch for the current block
  const epochId = getEpochForBlock(event.block.number);
  // Check for "-1" explicitly, as it is a truthy string
  if (epochId == "-1") {
    log.error(ERROR_NO_EPOCH + " {}", [event.block.number.toString()]);
    return;
  }

  // Load DLP instead of creating it to handle non-existent DLP case gracefully
  const dlp = Dlp.load(event.params.dlpId.toString());
  if (dlp == null) {
    log.error(ERROR_DLP_NOT_FOUND + ": {}", [event.params.dlpId.toString()]);
    return;
  }

  // Create proof using shared utility
  // V2 has DLP association but no user association in the proof
  createDataRegistryProof(
    event.transaction.hash.toHex(),
    epochId,
    event.params.fileId,
    event.params.proofIndex,
    event.block,
    event.transaction,
    null, // no userId in V2 proof
    dlp.id,
  );

  // Update totals using shared utility
  // V2 has both global and DLP totals
  const file = File.load(event.params.fileId.toString());
  if (!file || !file.owner) {
    return;
  }

  updateAllTotals(file.owner, event.params.dlpId.toString());
}
