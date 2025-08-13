import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  updateGlobalTotals,
  updateDlpTotals,
  updateAllTotals,
  updateTotalsFromFile,
} from "../../../../../src/lib/contract/shared/totals-updater";
import { createNewUser } from "../../../contract/utils/user";
import { createNewFile } from "../../../contract/utils/file-owner";
import { createNewTotals } from "../../../contract/utils/totals";
import { createNewUserTotals } from "../../../contract/utils/user-totals";
import {
  TOTALS_ID_GLOBAL,
  getTotalsDlpId,
} from "../../../../../src/lib/entity/totals";
import {
  getUserTotalsId,
  getUserTotalsIdDlp,
} from "../../../../../src/lib/entity/usertotals";

// Hook to clear the store before each test
beforeEach(() => {
  clearStore();
});

describe("updateGlobalTotals", () => {
  test("updates global totals for first-time user", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    createNewUser(userId);
    createNewTotals(TOTALS_ID_GLOBAL);

    // ACT
    updateGlobalTotals(userId);

    // ASSERT
    // Check user totals
    const userTotalsId = getUserTotalsId(userId);
    assert.entityCount("UserTotals", 1);
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "1",
    );

    // Check global totals
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "1",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "1",
    );
  });

  test("updates global totals for returning user", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    createNewUser(userId);
    createNewTotals(TOTALS_ID_GLOBAL);

    // Create existing user totals with 2 contributions
    const userTotalsId = getUserTotalsId(userId);
    const userTotals = createNewUserTotals(userTotalsId);
    userTotals.fileContributionsCount = GraphBigInt.fromI32(2);
    userTotals.save();

    // ACT
    updateGlobalTotals(userId);

    // ASSERT
    // Check user totals incremented
    assert.fieldEquals(
      "UserTotals",
      userTotalsId,
      "fileContributionsCount",
      "3",
    );

    // Check global totals - should increment total but not unique contributors
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "1",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "0",
    );
  });
});

describe("updateDlpTotals", () => {
  test("updates DLP totals for first-time user", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const dlpId = "dlp-123";
    createNewUser(userId);

    const dlpTotalsId = getTotalsDlpId(dlpId);
    createNewTotals(dlpTotalsId);

    // ACT
    updateDlpTotals(userId, dlpId);

    // ASSERT
    // Check DLP user totals
    const dlpUserTotalsId = getUserTotalsIdDlp(userId, dlpId);
    assert.entityCount("UserTotals", 1);
    assert.fieldEquals(
      "UserTotals",
      dlpUserTotalsId,
      "fileContributionsCount",
      "1",
    );

    // Check DLP totals
    assert.fieldEquals("Totals", dlpTotalsId, "totalFileContributions", "1");
    assert.fieldEquals("Totals", dlpTotalsId, "uniqueFileContributors", "1");
  });
});

describe("updateAllTotals", () => {
  test("updates both global and DLP totals when DLP provided", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    const dlpId = "dlp-456";
    createNewUser(userId);
    createNewTotals(TOTALS_ID_GLOBAL);
    createNewTotals(getTotalsDlpId(dlpId));

    // ACT
    updateAllTotals(userId, dlpId);

    // ASSERT
    // Check global totals
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "1",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "1",
    );

    // Check DLP totals
    const dlpTotalsId = getTotalsDlpId(dlpId);
    assert.fieldEquals("Totals", dlpTotalsId, "totalFileContributions", "1");
    assert.fieldEquals("Totals", dlpTotalsId, "uniqueFileContributors", "1");
  });

  test("updates only global totals when no DLP provided", () => {
    // ARRANGE
    const userId = "0x1234567890123456789012345678901234567890";
    createNewUser(userId);
    createNewTotals(TOTALS_ID_GLOBAL);

    // ACT
    updateAllTotals(userId, null);

    // ASSERT
    // Check global totals
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "1",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "1",
    );

    // Should not create any DLP totals
    assert.entityCount("Totals", 1); // Only global totals
  });
});

describe("updateTotalsFromFile", () => {
  test("updates totals based on file owner", () => {
    // ARRANGE
    const fileId = "123";
    const userId = "0x1234567890123456789012345678901234567890";
    createNewUser(userId);
    createNewFile(fileId, userId, "ipfs://test");
    createNewTotals(TOTALS_ID_GLOBAL);

    // ACT
    updateTotalsFromFile(fileId, null);

    // ASSERT
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "1",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "1",
    );
  });

  test("handles non-existent file gracefully", () => {
    // ARRANGE
    const fileId = "999";
    createNewTotals(TOTALS_ID_GLOBAL);

    // ACT - should not throw
    updateTotalsFromFile(fileId, null);

    // ASSERT - totals should remain unchanged
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "totalFileContributions",
      "0",
    );
    assert.fieldEquals(
      "Totals",
      TOTALS_ID_GLOBAL,
      "uniqueFileContributors",
      "0",
    );
  });
});
