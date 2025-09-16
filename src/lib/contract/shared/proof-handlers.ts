import {
  BigInt as GraphBigInt,
  log,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import { DataRegistryProof } from "../../../../generated/schema";
import { incrementCounter, getFileDlpProofsCounterId, getCounterValue } from "../../entity/counter";

/**
 * Generates a composite proof ID
 * @param fileId - The file ID
 * @param proofIndex - The proof index
 * @returns The composite proof ID in format: file-{fileId}-proof-{proofIndex}
 */
export function getProofId(fileId: GraphBigInt, proofIndex: GraphBigInt): string {
  return "file-" + fileId.toString() + "-proof-" + proofIndex.toString();
}

/**
 * Creates a DataRegistryProof entity with common fields
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
  epochId: string,
  fileId: GraphBigInt,
  proofIndex: GraphBigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction,
  userId: string | null = null,
  dlpId: string | null = null,
  attestor: Bytes | null = null,
): DataRegistryProof {
  // Use the shared method to generate proof ID
  const proofId = getProofId(fileId, proofIndex);

  log.info("Creating DataRegistry proof with ID: {}, transaction hash: {}", [
    proofId,
    transaction.hash.toHex(),
  ]);

  const proof = new DataRegistryProof(proofId);

  // Set common fields
  proof.epoch = epochId;
  proof.file = fileId.toString(); // Reference to File entity
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

  // Increment the counter for file-DLP proofs
  const effectiveDlpId = dlpId ? dlpId : "0"; // Use "0" for v1 which has no DLP
  const counterId = getFileDlpProofsCounterId(fileId.toString(), effectiveDlpId);
  const newCount = incrementCounter(counterId, "file-dlp-proofs");

  log.info("Incremented proof counter for file {} in DLP {}: {}", [
    fileId.toString(),
    effectiveDlpId,
    newCount.toString()
  ]);

  return proof;
}

/**
 * Checks if this is the first proof for a given file in a DLP
 * @param fileId - The file ID to check
 * @param dlpId - The DLP ID (optional, defaults to "0" for v1)
 * @returns true if this is the first proof for the file in the DLP
 */
export function isFirstProofForFile(fileId: GraphBigInt, dlpId: string | null = null): boolean {
  const effectiveDlpId = dlpId ? dlpId : "0"; // Use "0" for v1 which has no DLP
  const counterId = getFileDlpProofsCounterId(fileId.toString(), effectiveDlpId);
  const currentCount = getCounterValue(counterId);

  // If count is 0, this will be the first proof
  return currentCount.equals(GraphBigInt.zero());
}
