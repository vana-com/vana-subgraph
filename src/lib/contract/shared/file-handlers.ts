import { BigInt as GraphBigInt, log, ethereum } from "@graphprotocol/graph-ts";
import { File } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";
import { updateSchemaIndependentCounts } from "./schema-updater";

/**
 * Creates a new File entity from a FileAdded event
 * @param fileId - The unique file ID
 * @param ownerAddress - The owner's address
 * @param url - The file URL
 * @param block - The block information
 * @param transaction - The transaction information
 * @param schemaId - The schema ID (defaults to 0 for versions that don't support it)
 * @returns The created File entity
 */
export function createFileFromEvent(
  fileId: string,
  ownerAddress: string,
  url: string,
  block: ethereum.Block,
  transaction: ethereum.Transaction,
  schemaId: GraphBigInt = GraphBigInt.fromI32(0),
): File {
  log.info("Creating file {} for owner {} with transaction hash: {}", [
    fileId,
    ownerAddress,
    transaction.hash.toHex(),
  ]);

  // Create user entity if it doesn't exist
  const user = getOrCreateUser(ownerAddress);

  // Create new File entity
  const file = new File(fileId);
  file.owner = user.id;
  file.url = url;
  file.addedAtBlock = block.number;
  file.addedAtTimestamp = block.timestamp;
  file.transactionHash = transaction.hash;
  file.schemaId = schemaId;

  file.save();

  // Update schema independent counts if schema is provided (not default 0)
  if (!schemaId.isZero()) {
    updateSchemaIndependentCounts(ownerAddress, schemaId.toString(), fileId);
  }

  return file;
}

/**
 * Standard logging format for DataRegistry events
 * @param eventName - The name of the event being handled
 * @param transactionHash - The transaction hash
 */
export function logDataRegistryEvent(
  eventName: string,
  transactionHash: string,
): void {
  log.info("Handling DataRegistry {} with transaction hash: {}", [
    eventName,
    transactionHash,
  ]);
}
