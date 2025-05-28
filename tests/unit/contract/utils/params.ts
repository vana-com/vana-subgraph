import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Params } from "../../../../generated/schema";

export function paramsDefaults(id: string): Params {
  const params = new Params(id);

  params.subEligibilityThreshold = GraphBigInt.fromString(
    "500000000000000000000",
  );
  params.eligibilityThreshold = GraphBigInt.fromString(
    "1000000000000000000000",
  );
  params.stakeWithdrawalDelay = GraphBigInt.fromString("3150");
  params.daySize = GraphBigInt.fromString("450");
  params.epochSize = GraphBigInt.fromString("9450");
  params.epochRewardAmount = GraphBigInt.fromString("400000000000000000000000");
  params.eligibleDlpsLimit = GraphBigInt.zero();
  params.minDlpStakersPercentage = GraphBigInt.zero();
  params.maxDlpStakersPercentage = GraphBigInt.fromI32(100);
  params.minStakeAmount = GraphBigInt.zero();
  params.rewardClaimDelay = GraphBigInt.zero();
  params.minDlpRegistrationStake = GraphBigInt.zero();
  params.stakeRatingPercentage = GraphBigInt.zero();
  params.performanceRatingPercentage = GraphBigInt.zero();

  return params;
}

export function createNewParams(id: string): Params {
  const params = paramsDefaults(id);
  params.save();
  return params;
}
