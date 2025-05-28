import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  BigInt as GraphBigInt,
  ethereum,
  Bytes,
} from "@graphprotocol/graph-ts";
import { handleEpochDlpPerformancesSavedV5 } from "../../../../src/lib/contract/v5/dlp-performance";
import { createEpochDlpPerformancesSavedEvent } from "./utils/dlp-performance-events";
import { Dlp, Epoch, DlpPerformance } from "../../../../generated/schema";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("handleEpochDlpPerformancesSavedV5", () => {
  test("creates a new DlpPerformance entity with correct fields", () => {
    const epochId = 1;
    const dlpId = 1;
    const performanceRating = 1000;
    const tradingVolume = 2000;
    const uniqueContributors = 50;
    const dataAccessFees = 500;

    // Create prerequisite entities
    const epoch = new Epoch(epochId.toString());
    epoch.startBlock = GraphBigInt.fromI32(1000);
    epoch.endBlock = GraphBigInt.fromI32(2000);
    epoch.reward = GraphBigInt.fromI32(1000000);
    epoch.createdAt = GraphBigInt.fromI32(0);
    epoch.createdTxHash = Bytes.fromI32(0);
    epoch.createdAtBlock = GraphBigInt.fromI32(0);
    epoch.logIndex = GraphBigInt.fromI32(0);
    epoch.isFinalized = false;
    epoch.dlpIds = [];
    epoch.save();

    const dlp = new Dlp(dlpId.toString());
    dlp.creator = Bytes.fromI32(0);
    dlp.owner = Bytes.fromI32(0);
    dlp.address = Bytes.fromI32(0);
    dlp.treasury = Bytes.fromI32(0);
    dlp.createdAt = GraphBigInt.fromI32(0);
    dlp.createdTxHash = Bytes.fromI32(0);
    dlp.createdAtBlock = GraphBigInt.fromI32(0);
    dlp.performanceRating = GraphBigInt.zero();
    dlp.status = GraphBigInt.zero();
    dlp.name = "Test DLP";
    dlp.iconUrl = "test-icon.png";
    dlp.website = "test-website.com";
    dlp.metadata = "test-metadata";
    dlp.totals = "totals-1";
    dlp.isVerified = false;
    dlp.save();

    // Create and handle the event
    const event = createEpochDlpPerformancesSavedEvent(
      epochId,
      dlpId,
      performanceRating,
      tradingVolume,
      uniqueContributors,
      dataAccessFees,
    );

    handleEpochDlpPerformancesSavedV5(event);

    // Check that the DlpPerformance entity was created
    const performanceId = `${epochId}-${dlpId}`;
    assert.entityCount("DlpPerformance", 1);

    // Check that all fields were set correctly
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "dlp",
      dlpId.toString(),
    );
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "epoch",
      epochId.toString(),
    );
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "totalScore",
      performanceRating.toString(),
    );
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "tradingVolume",
      tradingVolume.toString(),
    );
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "uniqueContributors",
      uniqueContributors.toString(),
    );
    assert.fieldEquals(
      "DlpPerformance",
      performanceId,
      "dataAccessFees",
      dataAccessFees.toString(),
    );

    // Check that the DLP's performance rating was updated
    assert.fieldEquals(
      "Dlp",
      dlpId.toString(),
      "performanceRating",
      performanceRating.toString(),
    );

    // Check that the epoch's dlpIds array was updated
    assert.fieldEquals("Epoch", epochId.toString(), "dlpIds", `[${dlpId}]`);
  });
});
