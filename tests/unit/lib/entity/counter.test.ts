import { afterEach, describe, test } from "matchstick-as/assembly/index";
import { assert } from "matchstick-as/assembly/assert";
import { clearStore } from "@graphprotocol/graph-ts";
import {
  incrementCounter,
  getCounterValue,
  getFileDlpProofsCounterId
} from "../../../../src/lib/entity/counter";

describe("Counter Entity", () => {
  afterEach(() => {
    clearStore();
  });

  test("Should increment counter from 0 to 1 for new counter", () => {
    const counterId = "test-counter-1";
    const counterType = "test";

    const newValue = incrementCounter(counterId, counterType);

    assert.i32Equals(1, newValue);
    assert.i32Equals(1, getCounterValue(counterId));
  });

  test("Should increment existing counter correctly", () => {
    const counterId = "test-counter-2";
    const counterType = "test";

    incrementCounter(counterId, counterType);
    incrementCounter(counterId, counterType);
    const thirdValue = incrementCounter(counterId, counterType);

    assert.i32Equals(3, thirdValue);
    assert.i32Equals(3, getCounterValue(counterId));
  });

  test("Should return 0 for non-existent counter", () => {
    const counterId = "non-existent-counter";

    const value = getCounterValue(counterId);

    assert.i32Equals(0, value);
  });

  test("Should handle multiple different counters independently", () => {
    const counter1 = "counter-1";
    const counter2 = "counter-2";
    const counter3 = "counter-3";
    const counterType = "test";

    incrementCounter(counter1, counterType);
    incrementCounter(counter1, counterType);
    incrementCounter(counter2, counterType);
    incrementCounter(counter3, counterType);
    incrementCounter(counter3, counterType);
    incrementCounter(counter3, counterType);

    assert.i32Equals(2, getCounterValue(counter1));
    assert.i32Equals(1, getCounterValue(counter2));
    assert.i32Equals(3, getCounterValue(counter3));
  });

  test("Should generate correct file-DLP proofs counter ID", () => {
    const fileId = "file-123";
    const dlpId = "0xabc123";

    const counterId = getFileDlpProofsCounterId(fileId, dlpId);

    assert.stringEquals("proof-file-file-123-dlp-0xabc123", counterId);
  });

  test("Should generate consistent counter IDs for same inputs", () => {
    const fileId = "file-456";
    const dlpId = "0xdef456";

    const counterId1 = getFileDlpProofsCounterId(fileId, dlpId);
    const counterId2 = getFileDlpProofsCounterId(fileId, dlpId);

    assert.stringEquals(counterId1, counterId2);
  });

  test("Should generate different counter IDs for different files", () => {
    const fileId1 = "file-111";
    const fileId2 = "file-222";
    const dlpId = "0xabc123";

    const counterId1 = getFileDlpProofsCounterId(fileId1, dlpId);
    const counterId2 = getFileDlpProofsCounterId(fileId2, dlpId);

    assert.assertTrue(counterId1 != counterId2);
  });

  test("Should generate different counter IDs for different DLPs", () => {
    const fileId = "file-111";
    const dlpId1 = "0xabc123";
    const dlpId2 = "0xdef456";

    const counterId1 = getFileDlpProofsCounterId(fileId, dlpId1);
    const counterId2 = getFileDlpProofsCounterId(fileId, dlpId2);

    assert.assertTrue(counterId1 != counterId2);
  });

  test("Should correctly track file-DLP proof counts", () => {
    const fileId1 = "file-1";
    const fileId2 = "file-2";
    const dlpId1 = "0xdlp1";
    const dlpId2 = "0xdlp2";

    const counter1 = getFileDlpProofsCounterId(fileId1, dlpId1);
    const counter2 = getFileDlpProofsCounterId(fileId1, dlpId2);
    const counter3 = getFileDlpProofsCounterId(fileId2, dlpId1);

    incrementCounter(counter1, "proof-file-dlp");
    incrementCounter(counter1, "proof-file-dlp");
    incrementCounter(counter2, "proof-file-dlp");
    incrementCounter(counter3, "proof-file-dlp");
    incrementCounter(counter3, "proof-file-dlp");
    incrementCounter(counter3, "proof-file-dlp");

    assert.i32Equals(2, getCounterValue(counter1));
    assert.i32Equals(1, getCounterValue(counter2));
    assert.i32Equals(3, getCounterValue(counter3));
  });

  test("Should handle special characters in IDs", () => {
    const fileId = "file-with-special-chars-!@#$%";
    const dlpId = "0xDLP-WITH-UPPER-CASE";

    const counterId = getFileDlpProofsCounterId(fileId, dlpId);

    assert.stringEquals("proof-file-file-with-special-chars-!@#$%-dlp-0xDLP-WITH-UPPER-CASE", counterId);

    incrementCounter(counterId, "proof-file-dlp");
    assert.i32Equals(1, getCounterValue(counterId));
  });

  test("Should persist counter values across multiple operations", () => {
    const counterId = "persistent-counter";
    const counterType = "test";

    incrementCounter(counterId, counterType);
    assert.i32Equals(1, getCounterValue(counterId));

    incrementCounter(counterId, counterType);
    assert.i32Equals(2, getCounterValue(counterId));

    const finalValue = incrementCounter(counterId, counterType);
    assert.i32Equals(3, finalValue);
    assert.i32Equals(3, getCounterValue(counterId));
  });
});