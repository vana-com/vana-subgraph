import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

export class InitParams {
  DAY_SIZE: GraphBigInt;
  EPOCH_SIZE: GraphBigInt;
  EPOCH_REWARD_AMOUNT: GraphBigInt;

  constructor(
    daySize: GraphBigInt,
    epochSize: GraphBigInt,
    epochRewardAmount: GraphBigInt
  ) {
    this.DAY_SIZE = daySize;
    this.EPOCH_SIZE = epochSize;
    this.EPOCH_REWARD_AMOUNT = epochRewardAmount;
  }

  toString(): string {
    return `{
    DAY_SIZE: ${this.DAY_SIZE.toString()},
    EPOCH_SIZE: ${this.EPOCH_SIZE.toString()},
    EPOCH_REWARD_AMOUNT: ${this.EPOCH_REWARD_AMOUNT.toString()}
}`;
  }
}
