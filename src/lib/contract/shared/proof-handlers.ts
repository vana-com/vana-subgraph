import {
  BigInt as GraphBigInt,
  log,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import { DataRegistryProof, File } from "../../../../generated/schema";
import { decrementSchemaIndependentCounts } from "./schema-updater";

/**
 * Generates a composite proof ID
 * @param fileId - The file ID
 * @param proofIndex - The proof index
 * @returns The composite proof ID in format: file-{fileId}-proof-{proofIndex}
 */
export function getProofId(
  fileId: GraphBigInt,
  proofIndex: GraphBigInt,
): string {
  return "file-" + fileId.toString() + "-proof-" + proofIndex.toString();
}

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

  const proofId = getProofId(fileId, proofIndex);
  const proof = new DataRegistryProof(proofId);

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

  // If this is the first proof for this file (proof index 1), decrement schema independent counts
  if (proofIndex.equals(GraphBigInt.fromI32(1)) && userId) {
    const file = File.load(fileId.toString());
    if (file && !file.schemaId.isZero()) {
      decrementSchemaIndependentCounts(userId, file.schemaId.toString());
    }
  }

  return proof;
}
