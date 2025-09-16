import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Counter } from "../../../generated/schema";

/**
 * Gets or creates a counter entity
 * @param id - The counter ID
 * @param type - The counter type
 * @returns The counter entity
 */
export function getOrCreateCounter(id: string, type: string): Counter {
  let counter = Counter.load(id);

  if (counter == null) {
    counter = new Counter(id);
    counter.type = type;
    counter.count = GraphBigInt.zero();
    counter.save();
  }

  return counter;
}

/**
 * Increments a counter by 1
 * @param id - The counter ID
 * @param type - The counter type
 * @returns The updated count value
 */
export function incrementCounter(id: string, type: string): GraphBigInt {
  const counter = getOrCreateCounter(id, type);
  counter.count = counter.count.plus(GraphBigInt.fromI32(1));
  counter.save();
  return counter.count;
}

/**
 * Gets the current value of a counter
 * @param id - The counter ID
 * @returns The current count value or 0 if counter doesn't exist
 */
export function getCounterValue(id: string): GraphBigInt {
  const counter = Counter.load(id);
  return counter ? counter.count : GraphBigInt.zero();
}

/**
 * Creates a file-DLP-proofs counter ID
 * @param fileId - The file ID
 * @param dlpId - The DLP ID
 * @returns Counter ID for file-DLP proof counting
 */
export function getFileDlpProofsCounterId(fileId: string, dlpId: string): string {
  return `proof-file-${fileId}-dlp-${dlpId}`;
}