import { Params } from "../../../../generated/schema";
import { CONFIG } from "../../config/global-chain-config";
import { PARAMS_ID_CURRENT } from "./constants";

export function getOrCreateCurrentParams(): Params {
  return getOrCreateParams(PARAMS_ID_CURRENT);
}

export function getOrCreateParams(paramsId: string): Params {
  let params = Params.load(paramsId);
  if (params == null) {
    params = new Params(paramsId);
    params.daySize = CONFIG.INIT_PARAMS.DAY_SIZE;
    params.epochSize = CONFIG.INIT_PARAMS.EPOCH_SIZE;
    params.epochRewardAmount = CONFIG.INIT_PARAMS.EPOCH_REWARD_AMOUNT;
    params.save();
  }
  return params;
}
