import { log, ethereum, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

/**
 * Standard logging format for all contract events
 * @param eventName - The name of the event being handled
 * @param transactionHash - The transaction hash
 */
export function logEventWithTxHash(
  eventName: string,
  transactionHash: string,
): void {
  log.info("Handling {} with transaction hash: {}", [
    eventName,
    transactionHash,
  ]);
}

/**
 * Logs an entity not found error with context
 * @param entityType - The type of entity (e.g., "DLP", "User", "Epoch")
 * @param entityId - The ID of the entity that was not found
 * @param context - Additional context about where the error occurred
 */
export function logEntityNotFound(
  entityType: string,
  entityId: string,
  context?: string,
): void {
  const message = context
    ? `${entityType} not found for ${context}: {}`
    : `${entityType} not found: {}`;
  log.error(message, [entityId]);
}

/**
 * Sets common blockchain metadata fields on an entity
 * @param entity - The entity to set metadata on
 * @param block - The block information
 * @param transaction - The transaction information
 * @param logIndex - Optional log index for the event
 */
export function setBlockchainMetadata(
  entity: any,
  block: ethereum.Block,
  transaction: ethereum.Transaction,
  logIndex?: GraphBigInt,
): void {
  entity.createdAt = block.timestamp;
  entity.createdAtBlock = block.number;
  entity.createdTxHash = transaction.hash;

  if (logIndex) {
    entity.logIndex = logIndex;
  }
}

/**
 * Creates a composite ID from multiple parts
 * @param parts - Array of string parts to join
 * @param separator - Separator to use (defaults to "-")
 * @returns The composite ID
 */
export function createCompositeId(parts: string[], separator = "-"): string {
  return parts.join(separator);
}

/**
 * Creates a transaction-based ID
 * @param transactionHash - The transaction hash
 * @param logIndex - The log index
 * @returns The transaction-based ID
 */
export function createTransactionId(
  transactionHash: string,
  logIndex: GraphBigInt,
): string {
  return `${transactionHash}-${logIndex.toString()}`;
}
