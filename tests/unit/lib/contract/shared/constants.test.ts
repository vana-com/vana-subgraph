import {
  assert,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { 
  ONE,
  ZERO,
  ERROR_NO_EPOCH,
  ERROR_DLP_NOT_FOUND,
  ERROR_NO_FILE_OWNER,
  DEFAULT_SCHEMA_ID
} from "../../../../../src/lib/contract/shared/constants";

describe("Shared Constants", () => {
  test("BigInt constants are correct", () => {
    // ASSERT
    assert.bigIntEquals(ONE, GraphBigInt.fromI32(1));
    assert.bigIntEquals(ZERO, GraphBigInt.fromI32(0));
    assert.bigIntEquals(DEFAULT_SCHEMA_ID, ZERO);
  });

  test("Error message constants are defined", () => {
    // ASSERT
    assert.stringEquals(ERROR_NO_EPOCH, "No epoch found for block");
    assert.stringEquals(ERROR_DLP_NOT_FOUND, "DLP not found for proof");
    assert.stringEquals(ERROR_NO_FILE_OWNER, "Cannot update totals: file not found or has no owner");
  });

  test("Constants are usable in computations", () => {
    // ARRANGE & ACT
    const result = ONE.plus(ZERO);
    const doubled = ONE.times(GraphBigInt.fromI32(2));

    // ASSERT
    assert.bigIntEquals(result, GraphBigInt.fromI32(1));
    assert.bigIntEquals(doubled, GraphBigInt.fromI32(2));
  });
});