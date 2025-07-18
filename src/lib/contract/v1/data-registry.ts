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
  ERROR_NO_EPOCH,
  DEFAULT_SCHEMA_ID,
} from "../shared/index";

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

  // Create proof using shared utility
  // V1 doesn't have user or DLP associations in the proof
  createDataRegistryProof(
    event.transaction.hash.toHex(),
    epochId,
    event.params.fileId,
    event.params.proofIndex,
    event.block,
    event.transaction,
  );

  // Update totals using shared utility
  // V1 only has global totals, no DLP-specific totals
  updateTotalsFromFile(event.params.fileId.toString());
}
