import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

/**
 * Common constants used across contract handlers
 */

// Common BigInt values
export const ONE = GraphBigInt.fromI32(1);
export const ZERO = GraphBigInt.fromI32(0);

// Error messages
export const ERROR_NO_EPOCH = "No epoch found for block";
export const ERROR_DLP_NOT_FOUND = "DLP not found for proof";
export const ERROR_NO_FILE_OWNER =
  "Cannot update totals: file not found or has no owner";

// Default values
export const DEFAULT_SCHEMA_ID = ZERO;
