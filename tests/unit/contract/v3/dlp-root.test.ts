import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { handleStakeCreatedV3 } from "../../../../src/lib/contract/v3/dlp-root";
import {
  createNewEpoch,
  createNewEpochReference,
  createNewParams,
  createNewTotals,
  createNewUser,
} from "../utils";
import { createNewDlp } from "../utils/dlp";
import { createStakeCreatedEvent } from "./utils/dlp-root-events";
import { EPOCH_REFERENCE_ID_CURRENT } from "../../../../src/lib/entity/epoch/constants";
import { PARAMS_ID_CURRENT } from "../../../../src/lib/entity/params/constants";
import {
  getTotalsIdDlp,
  TOTALS_ID_GLOBAL,
} from "../../../../src/lib/entity/totals";
import {
  getUserTotalsId,
  getUserTotalsIdDlp,
} from "../../../../src/lib/entity/usertotals";

beforeEach(() => {
  clearStore();
});

describe("handleStakeCreatedV3", () => {
  test("creates totals, user totals, user positions, stakes, and dlp", () => {
    createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");
    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewParams(PARAMS_ID_CURRENT);

    const stakeEvent = createStakeCreatedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      1,
      10,
    );

    handleStakeCreatedV3(stakeEvent);

    // Dlp
    assert.entityCount("Dlp", 1);

    const dlpId = "1";
    assert.fieldEquals("Dlp", dlpId, "id", dlpId);
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "creator",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "address",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "createdAt",
      stakeEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "createdAtBlock",
      stakeEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "createdTxHash",
      stakeEvent.transaction.hash.toHex(),
    );
    assert.fieldEquals("Dlp", dlpId, "minStakeAmount", "0");
    assert.fieldEquals("Dlp", dlpId, "activeStakedAmount", "10");
    assert.fieldEquals("Dlp", dlpId, "delegatedStakedAmount", "10");
    assert.fieldEquals("Dlp", dlpId, "status", "0");
    assert.fieldEquals("Dlp", dlpId, "name", "");
    assert.fieldEquals("Dlp", dlpId, "iconUrl", "");
    assert.fieldEquals("Dlp", dlpId, "website", "");
    assert.fieldEquals("Dlp", dlpId, "metadata", "");
    assert.fieldEquals("Dlp", dlpId, "stakersPercentage", "0");
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "owner",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "treasury",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("Dlp", dlpId, "totals", "dlp-1");

    // Stake
    assert.entityCount("Stake", 1);

    const stakeId = "1";
    assert.fieldEquals("Stake", stakeId, "amount", "10");
    assert.fieldEquals("Stake", stakeId, "dlp", "1");
    assert.fieldEquals(
      "Stake",
      stakeId,
      "user",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("Stake", stakeId, "epoch", "1");
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdAt",
      stakeEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdAtBlock",
      stakeEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdTxHash",
      stakeEvent.transaction.hash.toHex(),
    );

    // Totals
    assert.entityCount("Totals", 2);

    const totalsId0 = TOTALS_ID_GLOBAL;
    assert.fieldEquals("Totals", totalsId0, "activeStakedAmount", "10");
    assert.fieldEquals("Totals", totalsId0, "delegatedStakedAmount", "10");
    assert.fieldEquals("Totals", totalsId0, "uniqueStakers", "1");
    assert.fieldEquals("Totals", totalsId0, "totalFileContributions", "0");
    assert.fieldEquals("Totals", totalsId0, "uniqueFileContributors", "0");

    const totalsId1 = getTotalsIdDlp("1");
    assert.fieldEquals("Totals", totalsId1, "activeStakedAmount", "10");
    assert.fieldEquals("Totals", totalsId1, "delegatedStakedAmount", "10");
    assert.fieldEquals("Totals", totalsId1, "uniqueStakers", "1");
    assert.fieldEquals("Totals", totalsId1, "totalFileContributions", "0");
    assert.fieldEquals("Totals", totalsId1, "uniqueFileContributors", "0");

    // UserTotals
    assert.entityCount("UserTotals", 2);

    const userTotalsId0 = getUserTotalsId(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("UserTotals", userTotalsId0, "activeStakedAmount", "10");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "delegatedStakedAmount",
      "10",
    );
    assert.fieldEquals("UserTotals", userTotalsId0, "activeStakesCount", "1");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "delegatedStakesCount",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "fileContributionsCount",
      "0",
    );

    const userTotalsId1 = getUserTotalsIdDlp(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "1",
    );
    assert.fieldEquals("UserTotals", userTotalsId1, "activeStakedAmount", "10");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "delegatedStakedAmount",
      "10",
    );
    assert.fieldEquals("UserTotals", userTotalsId1, "activeStakesCount", "1");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "delegatedStakesCount",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "fileContributionsCount",
      "0",
    );
  });

  test("creates totals, user totals, user positions, stakes, and updates existing dlp totals", () => {
    const user = createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");

    const globalTotals = createNewTotals(TOTALS_ID_GLOBAL);
    globalTotals.activeStakedAmount = GraphBigInt.fromString("76");
    globalTotals.delegatedStakedAmount = GraphBigInt.fromString("89");
    globalTotals.uniqueStakers = GraphBigInt.fromString("5");
    globalTotals.save();

    const dlpTotalsId = getTotalsIdDlp("1");
    const dlpTotals = createNewTotals(dlpTotalsId);
    dlpTotals.activeStakedAmount = GraphBigInt.fromString("53");
    dlpTotals.delegatedStakedAmount = GraphBigInt.fromString("64");
    dlpTotals.uniqueStakers = GraphBigInt.fromString("2");
    dlpTotals.save();

    const dlp = createNewDlp("1", user.id, dlpTotals.id);
    dlp.activeStakedAmount = GraphBigInt.fromString("53");
    dlp.delegatedStakedAmount = GraphBigInt.fromString("64");
    dlp.save();

    createNewEpoch("1");
    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewParams(PARAMS_ID_CURRENT);

    const stakeEvent = createStakeCreatedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      1,
      10,
    );

    handleStakeCreatedV3(stakeEvent);

    // Dlp
    assert.entityCount("Dlp", 1);

    const dlpId = "1";
    assert.fieldEquals("Dlp", dlpId, "id", dlpId);
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "creator",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "address",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "createdTxHash",
      "0x64d2db2dbfd04f79352be0ec93977a56f6399784210454b37faccf0d418cfa8b",
    );
    assert.fieldEquals("Dlp", dlpId, "minStakeAmount", "0");
    assert.fieldEquals("Dlp", dlpId, "activeStakedAmount", "63");
    assert.fieldEquals("Dlp", dlpId, "delegatedStakedAmount", "74");
    assert.fieldEquals("Dlp", dlpId, "status", "0");
    assert.fieldEquals("Dlp", dlpId, "name", "");
    assert.fieldEquals("Dlp", dlpId, "iconUrl", "");
    assert.fieldEquals("Dlp", dlpId, "website", "");
    assert.fieldEquals("Dlp", dlpId, "metadata", "");
    assert.fieldEquals("Dlp", dlpId, "stakersPercentage", "0");
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "owner",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals(
      "Dlp",
      dlpId,
      "treasury",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("Dlp", dlpId, "totals", "dlp-1");

    // Stake
    assert.entityCount("Stake", 1);

    const stakeId = "1";
    assert.fieldEquals("Stake", stakeId, "amount", "10");
    assert.fieldEquals("Stake", stakeId, "dlp", "1");
    assert.fieldEquals(
      "Stake",
      stakeId,
      "user",
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("Stake", stakeId, "epoch", "1");
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdAt",
      stakeEvent.block.timestamp.toString(),
    );
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdAtBlock",
      stakeEvent.block.number.toString(),
    );
    assert.fieldEquals(
      "Stake",
      stakeId,
      "createdTxHash",
      stakeEvent.transaction.hash.toHex(),
    );

    // Totals
    assert.entityCount("Totals", 2);

    const totalsId0 = TOTALS_ID_GLOBAL;
    assert.fieldEquals("Totals", totalsId0, "activeStakedAmount", "86");
    assert.fieldEquals("Totals", totalsId0, "delegatedStakedAmount", "99");
    assert.fieldEquals("Totals", totalsId0, "uniqueStakers", "6");
    assert.fieldEquals("Totals", totalsId0, "totalFileContributions", "0");
    assert.fieldEquals("Totals", totalsId0, "uniqueFileContributors", "0");

    const totalsId1 = getTotalsIdDlp("1");
    assert.fieldEquals("Totals", totalsId1, "activeStakedAmount", "63");
    assert.fieldEquals("Totals", totalsId1, "delegatedStakedAmount", "74");
    assert.fieldEquals("Totals", totalsId1, "uniqueStakers", "3");
    assert.fieldEquals("Totals", totalsId1, "totalFileContributions", "0");
    assert.fieldEquals("Totals", totalsId1, "uniqueFileContributors", "0");

    // UserTotals
    assert.entityCount("UserTotals", 2);

    const userTotalsId0 = getUserTotalsId(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
    );
    assert.fieldEquals("UserTotals", userTotalsId0, "activeStakedAmount", "10");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "delegatedStakedAmount",
      "10",
    );
    assert.fieldEquals("UserTotals", userTotalsId0, "activeStakesCount", "1");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "delegatedStakesCount",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId0,
      "fileContributionsCount",
      "0",
    );

    const userTotalsId1 = getUserTotalsIdDlp(
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      "1",
    );
    assert.fieldEquals("UserTotals", userTotalsId1, "activeStakedAmount", "10");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "delegatedStakedAmount",
      "10",
    );
    assert.fieldEquals("UserTotals", userTotalsId1, "activeStakesCount", "1");
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "delegatedStakesCount",
      "1",
    );
    assert.fieldEquals(
      "UserTotals",
      userTotalsId1,
      "fileContributionsCount",
      "0",
    );
  });

  test("fails when current epoch reference is not set", () => {
    createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");
    createNewEpoch("1");
    createNewParams(PARAMS_ID_CURRENT);

    const stakeEvent = createStakeCreatedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      1,
      10,
    );

    handleStakeCreatedV3(stakeEvent);

    // Not set
    assert.entityCount("Dlp", 0);
    assert.entityCount("Stake", 0);
    assert.entityCount("Totals", 0);
    assert.entityCount("UserTotals", 0);
  });

  test("fails when dlp is deregistered", () => {
    const user = createNewUser("0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce");
    createNewEpoch("1");

    const dlpTotalsId = getTotalsIdDlp("1");
    const dlpTotals = createNewTotals(dlpTotalsId);
    const dlp = createNewDlp("1", user.id, dlpTotals.id);
    dlp.status = GraphBigInt.fromI32(4); // Deregistered
    dlp.save();

    createNewEpochReference(EPOCH_REFERENCE_ID_CURRENT, "1");
    createNewParams(PARAMS_ID_CURRENT);

    const stakeEvent = createStakeCreatedEvent(
      1,
      "0x334e8bbf9c7822fc3f66b11cb0d8ef84c5a4b5ce",
      1,
      10,
    );

    handleStakeCreatedV3(stakeEvent);

    // Dlp
    assert.entityCount("Dlp", 1);

    const dlpId = "1";
    assert.fieldEquals("Dlp", dlpId, "status", "4");
    assert.fieldEquals("Dlp", dlpId, "activeStakedAmount", "0");
    assert.fieldEquals("Dlp", dlpId, "delegatedStakedAmount", "0");

    // Totals
    assert.entityCount("Totals", 1);

    const totalsId0 = getTotalsIdDlp("1");
    assert.fieldEquals("Totals", totalsId0, "activeStakedAmount", "0");
    assert.fieldEquals("Totals", totalsId0, "delegatedStakedAmount", "0");
    assert.fieldEquals("Totals", totalsId0, "uniqueStakers", "0");
    assert.fieldEquals("Totals", totalsId0, "totalFileContributions", "0");
    assert.fieldEquals("Totals", totalsId0, "uniqueFileContributors", "0");

    assert.entityCount("Stake", 0);
    assert.entityCount("UserTotals", 0);
  });
});
