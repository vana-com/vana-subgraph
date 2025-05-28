import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
  log,
} from "matchstick-as/assembly/index";
import {
  BigInt as GraphBigInt,
  ethereum,
  Bytes,
  Address,
} from "@graphprotocol/graph-ts";
import {
  handleDlpRegisteredV5,
  handleDlpUpdatedV5,
  handleDlpStatusUpdatedV5,
  handleDlpVerificationUpdatedV5,
  handleDlpTokenUpdatedV5,
} from "../../../../src/lib/contract/v5/dlp-registry";
import {
  createDlpRegisteredEvent,
  createDlpUpdatedEvent,
  createDlpStatusUpdatedEvent,
  createDlpVerificationUpdatedEvent,
  createDlpTokenUpdatedEvent,
  createDlpEligibilityThresholdUpdatedEvent,
} from "./utils/dlp-registry-events";
import { createNewDlp } from "../utils";
import { Dlp, Params } from "../../../../generated/schema";
import { PARAMS_ID_CURRENT } from "../../../../src/lib/entity/params/constants";

// Clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("handleDlpRegisteredV5", () => {
  test("creates a new Dlp entity with correct fields", () => {
    // Create the DlpRegistered event
    const dlpId = 1;
    const dlpAddressStr = "0x1111111111111111111111111111111111111111";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    const treasuryAddressStr = "0x3333333333333333333333333333333333333333";
    const name = "Test DLP";
    const iconUrl = "https://example.com/icon.png";
    const website = "https://example.com";
    const metadata = "{}";

    const dlpRegisteredEvent = createDlpRegisteredEvent(
      dlpId,
      dlpAddressStr,
      ownerAddressStr,
      treasuryAddressStr,
      name,
      iconUrl,
      website,
      metadata,
    );

    handleDlpRegisteredV5(dlpRegisteredEvent);

    // Check that the Dlp entity was created
    assert.entityCount("Dlp", 1);

    // Check that all fields were set correctly
    assert.fieldEquals("Dlp", "1", "address", dlpAddressStr);
    assert.fieldEquals("Dlp", "1", "owner", ownerAddressStr);
    assert.fieldEquals("Dlp", "1", "treasury", treasuryAddressStr);
    assert.fieldEquals("Dlp", "1", "name", name);
    assert.fieldEquals("Dlp", "1", "iconUrl", iconUrl);
    assert.fieldEquals("Dlp", "1", "website", website);
    assert.fieldEquals("Dlp", "1", "metadata", metadata);
    assert.fieldEquals("Dlp", "1", "status", "1"); // REGISTERED status
    assert.fieldEquals("Dlp", "1", "isVerified", "false");
  });
});

describe("handleDlpUpdatedV5", () => {
  test("updates an existing Dlp entity correctly", () => {
    // Create a Dlp first
    const dlpId = "1";
    const dlpAddressStr = "0x1111111111111111111111111111111111111111";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Now update it with different values
    const newOwnerAddressStr = "0x4444444444444444444444444444444444444444";
    const newTreasuryAddressStr = "0x5555555555555555555555555555555555555555";
    const newName = "Updated DLP";
    const newIconUrl = "https://example.com/new-icon.png";
    const newWebsite = "https://updated-example.com";
    const newMetadata = '{"updated": true}';

    const dlpUpdatedEvent = createDlpUpdatedEvent(
      1,
      dlpAddressStr,
      newOwnerAddressStr,
      newTreasuryAddressStr,
      newName,
      newIconUrl,
      newWebsite,
      newMetadata,
    );

    handleDlpUpdatedV5(dlpUpdatedEvent);

    // Check that fields were updated
    assert.fieldEquals("Dlp", dlpId, "owner", newOwnerAddressStr);
    assert.fieldEquals("Dlp", dlpId, "treasury", newTreasuryAddressStr);
    assert.fieldEquals("Dlp", dlpId, "name", newName);
    assert.fieldEquals("Dlp", dlpId, "iconUrl", newIconUrl);
    assert.fieldEquals("Dlp", dlpId, "website", newWebsite);
    assert.fieldEquals("Dlp", dlpId, "metadata", newMetadata);
  });

  test("fails gracefully when dlp does not exist", () => {
    // Create an update event for a non-existent DLP
    const dlpId = 999;
    const dlpAddressStr = "0x1111111111111111111111111111111111111111";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    const treasuryAddressStr = "0x3333333333333333333333333333333333333333";
    const name = "Test DLP";
    const iconUrl = "https://example.com/icon.png";
    const website = "https://example.com";
    const metadata = "{}";

    const dlpUpdatedEvent = createDlpUpdatedEvent(
      dlpId,
      dlpAddressStr,
      ownerAddressStr,
      treasuryAddressStr,
      name,
      iconUrl,
      website,
      metadata,
    );

    // The handler should log an error but not throw
    handleDlpUpdatedV5(dlpUpdatedEvent);

    // Ensure no entities were created
    assert.entityCount("Dlp", 0);
  });
});

describe("handleDlpStatusUpdatedV5", () => {
  test("updates a Dlp status correctly", () => {
    // Create a Dlp first
    const dlpId = "1";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Now update its status
    const newStatus = 2; // ELIGIBLE status

    const dlpStatusUpdatedEvent = createDlpStatusUpdatedEvent(1, newStatus);

    handleDlpStatusUpdatedV5(dlpStatusUpdatedEvent);

    // Check that the status was updated
    assert.fieldEquals("Dlp", dlpId, "status", newStatus.toString());
  });

  test("fails gracefully when dlp does not exist", () => {
    // Try to update status for a non-existent DLP
    const dlpId = 999;
    const newStatus = 2; // ELIGIBLE status

    const dlpStatusUpdatedEvent = createDlpStatusUpdatedEvent(dlpId, newStatus);

    // The handler should log an error but not throw
    handleDlpStatusUpdatedV5(dlpStatusUpdatedEvent);

    // Ensure no entities were created
    assert.entityCount("Dlp", 0);
  });
});

describe("handleDlpVerificationUpdatedV5", () => {
  test("updates a Dlp verification status correctly", () => {
    // Create a Dlp first
    const dlpId = "1";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Now verify it
    const verified = true;

    const dlpVerificationUpdatedEvent = createDlpVerificationUpdatedEvent(
      1,
      verified,
    );

    handleDlpVerificationUpdatedV5(dlpVerificationUpdatedEvent);

    // Check that the verification status was updated
    assert.fieldEquals("Dlp", dlpId, "isVerified", verified.toString());
  });

  test("fails gracefully when dlp does not exist", () => {
    // Try to update verification status for a non-existent DLP
    const dlpId = 999;
    const verified = true;

    const dlpVerificationUpdatedEvent = createDlpVerificationUpdatedEvent(
      dlpId,
      verified,
    );

    // The handler should log an error but not throw
    handleDlpVerificationUpdatedV5(dlpVerificationUpdatedEvent);

    // Ensure no entities were created
    assert.entityCount("Dlp", 0);
  });
});

describe("handleDlpTokenUpdatedV5", () => {
  test("updates a Dlp token address correctly", () => {
    // Create a Dlp first
    const dlpId = "1";
    const ownerAddressStr = "0x2222222222222222222222222222222222222222";
    createNewDlp(dlpId, ownerAddressStr, "Test DLP");

    // Now update its token
    const tokenAddress = "0x6666666666666666666666666666666666666666";

    const dlpTokenUpdatedEvent = createDlpTokenUpdatedEvent(1, tokenAddress);

    handleDlpTokenUpdatedV5(dlpTokenUpdatedEvent);

    // Check that the token address was updated
    assert.fieldEquals("Dlp", dlpId, "token", tokenAddress);
  });

  test("fails gracefully when dlp does not exist", () => {
    // Try to update token for a non-existent DLP
    const dlpId = 999;
    const tokenAddress = "0x6666666666666666666666666666666666666666";

    const dlpTokenUpdatedEvent = createDlpTokenUpdatedEvent(
      dlpId,
      tokenAddress,
    );

    // The handler should log an error but not throw
    handleDlpTokenUpdatedV5(dlpTokenUpdatedEvent);

    // Ensure no entities were created
    assert.entityCount("Dlp", 0);
  });
});
