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
  });

  test("returns existing params when they exist", () => {
    createNewParams(PARAMS_ID_CURRENT);

    const result = getOrCreateCurrentParams();

    assert.assertNotNull(result);
    assert.entityCount("Params", 1);
  });
});
