import { log } from "@graphprotocol/graph-ts";

import {
  FileAdded as FileAddedEvent,
  ProofAdded as FileProofAdded,
} from "../../../../generated/DataRegistryImplementationV1/DataRegistryImplementationV1";
import { getEpochForBlock } from "../../entity/epoch";
import {
  createFileFromEvent,
  logDataRegistryEvent,
  createDataRegistryProof,
  updateTotalsFromFile,
  isFirstProofForFile,
  ERROR_NO_EPOCH,
  DEFAULT_SCHEMA_ID, updateAllTotals,
} from "../shared/index";
import {File} from "../../../../generated/schema";

export function handleFileAddedV1(event: FileAddedEvent): void {
  logDataRegistryEvent("FileAdded", event.transaction.hash.toHex());

  // Create file entity using shared utility
  // V1 of the contract does not support schemaId, so we use default (0)
  createFileFromEvent(
    event.params.fileId.toString(),
    event.params.ownerAddress.toHex(),
    event.params.url,
    event.block,
    event.transaction,
    DEFAULT_SCHEMA_ID,
  );
}

export function handleDataRegistryProofAddedV1(event: FileProofAdded): void {
  logDataRegistryEvent("ProofAdded", event.transaction.hash.toHex());

  // Get epoch for the current block
  const epochId = getEpochForBlock(event.block.number);
  if (!epochId) {
    log.error(ERROR_NO_EPOCH + " {}", [event.block.number.toString()]);
    return;
  }

  // Check if this is the first proof for the file
  const isFirstProof = isFirstProofForFile(event.params.fileId);

  // Create proof using shared utility
  // V1 doesn't have user or DLP associations in the proof
  createDataRegistryProof(
    epochId,
    event.params.fileId,
    event.params.proofIndex,
    event.block,
    event.transaction,
  );

  // Update totals only if this is the first proof for the file
  // V1 only has global totals, no DLP-specific totals
  if (isFirstProof) {
    updateTotalsFromFile(event.params.fileId.toString());
  }
}
