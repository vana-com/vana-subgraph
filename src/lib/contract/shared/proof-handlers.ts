import {
  BigInt as GraphBigInt,
  log,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import { DataRegistryProof } from "../../../../generated/schema";

/**
 * Creates a DataRegistryProof entity with common fields
 * @param transactionHash - The transaction hash (used as entity ID)
 * @param epochId - The epoch ID
 * @param fileId - The file ID
 * @param proofIndex - The proof index
 * @param block - The block information
 * @param transaction - The transaction information
 * @param userId - Optional user ID (for V3+)
 * @param dlpId - Optional DLP ID (for V2+)
 * @param attestor - Optional attestor address (for versions that support it)
 * @returns The created DataRegistryProof entity
 */
export function createDataRegistryProof(
  transactionHash: string,
  epochId: string,
  fileId: GraphBigInt,
  proofIndex: GraphBigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction,
  userId: string | null = null,
  dlpId: string | null = null,
  attestor: Bytes | null = null,
): DataRegistryProof {
  log.info("Creating DataRegistry proof for transaction hash: {}", [
    transactionHash,
  ]);

  const proof = new DataRegistryProof(transactionHash);

  // Set common fields
  proof.epoch = epochId;
  proof.fileId = fileId;
  proof.proofIndex = proofIndex;
  proof.createdAt = block.timestamp;
  proof.createdAtBlock = block.number;
  proof.createdTxHash = transaction.hash;

  // Set optional fields if provided
  if (userId) {
    proof.user = userId;
  }
  if (dlpId) {
    proof.dlp = dlpId;
  }
  if (attestor) {
    proof.attestor = attestor;
  }

  proof.save();
  return proof;
}
