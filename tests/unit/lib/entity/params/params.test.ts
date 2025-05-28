import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  PARAMS_ID_CURRENT,
  getOrCreateCurrentParams,
  getOrCreateParams,
} from "../../../../../src/lib/entity/params";
import { CONFIG } from "../../../../../src/lib/config/global-chain-config";
import { createNewParams } from "../../../contract/utils";

beforeEach(() => {
  clearStore();
});

describe("getOrCreateParams", () => {
  test("creates new params with default values when they don't exist", () => {
    const result = getOrCreateParams("epoch-1");

    assert.assertNotNull(result);
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "eligibilityThreshold",
      CONFIG.INIT_PARAMS.ELIGIBILITY_THRESHOLD.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "subEligibilityThreshold",
      CONFIG.INIT_PARAMS.SUB_ELIGIBILITY_THRESHOLD.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "stakeWithdrawalDelay",
      CONFIG.INIT_PARAMS.STAKE_WITHDRAWAL_DELAY.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "daySize",
      CONFIG.INIT_PARAMS.DAY_SIZE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "epochSize",
      CONFIG.INIT_PARAMS.EPOCH_SIZE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "epochRewardAmount",
      CONFIG.INIT_PARAMS.EPOCH_REWARD_AMOUNT.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "eligibleDlpsLimit",
      CONFIG.INIT_PARAMS.ELIGIBLE_DLPS_LIMIT.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "minDlpStakersPercentage",
      CONFIG.INIT_PARAMS.MIN_DLP_STAKERS_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "maxDlpStakersPercentage",
      CONFIG.INIT_PARAMS.MAX_DLP_STAKERS_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "minStakeAmount",
      CONFIG.INIT_PARAMS.MIN_STAKE_AMOUNT.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "rewardClaimDelay",
      CONFIG.INIT_PARAMS.REWARD_CLAIM_DELAY.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "minDlpRegistrationStake",
      CONFIG.INIT_PARAMS.MIN_DLP_REGISTRATION_STAKE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "stakeRatingPercentage",
      CONFIG.INIT_PARAMS.STAKE_RATING_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      "epoch-1",
      "performanceRatingPercentage",
      CONFIG.INIT_PARAMS.PERFORMANCE_RATING_PERCENTAGE.toString(),
    );
  });

  test("returns existing params when they exist", () => {
    createNewParams("epoch-1");

    const result = getOrCreateParams("epoch-1");

    assert.assertNotNull(result);
    assert.entityCount("Params", 1);
  });
});

describe("getOrCreateCurrentParams", () => {
  test("creates new params with default values when they don't exist", () => {
    const result = getOrCreateCurrentParams();

    assert.assertNotNull(result);
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "eligibilityThreshold",
      CONFIG.INIT_PARAMS.ELIGIBILITY_THRESHOLD.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "subEligibilityThreshold",
      CONFIG.INIT_PARAMS.SUB_ELIGIBILITY_THRESHOLD.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "stakeWithdrawalDelay",
      CONFIG.INIT_PARAMS.STAKE_WITHDRAWAL_DELAY.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "daySize",
      CONFIG.INIT_PARAMS.DAY_SIZE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "epochSize",
      CONFIG.INIT_PARAMS.EPOCH_SIZE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "epochRewardAmount",
      CONFIG.INIT_PARAMS.EPOCH_REWARD_AMOUNT.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "eligibleDlpsLimit",
      CONFIG.INIT_PARAMS.ELIGIBLE_DLPS_LIMIT.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "minDlpStakersPercentage",
      CONFIG.INIT_PARAMS.MIN_DLP_STAKERS_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "maxDlpStakersPercentage",
      CONFIG.INIT_PARAMS.MAX_DLP_STAKERS_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "minStakeAmount",
      CONFIG.INIT_PARAMS.MIN_STAKE_AMOUNT.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "rewardClaimDelay",
      CONFIG.INIT_PARAMS.REWARD_CLAIM_DELAY.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "minDlpRegistrationStake",
      CONFIG.INIT_PARAMS.MIN_DLP_REGISTRATION_STAKE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "stakeRatingPercentage",
      CONFIG.INIT_PARAMS.STAKE_RATING_PERCENTAGE.toString(),
    );
    assert.fieldEquals(
      "Params",
      PARAMS_ID_CURRENT,
      "performanceRatingPercentage",
      CONFIG.INIT_PARAMS.PERFORMANCE_RATING_PERCENTAGE.toString(),
    );
  });

  test("returns existing params when they exist", () => {
    createNewParams(PARAMS_ID_CURRENT);

    const result = getOrCreateCurrentParams();

    assert.assertNotNull(result);
    assert.entityCount("Params", 1);
  });
});
