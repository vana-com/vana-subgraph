import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Params } from "../../../../generated/schema";

export function paramsDefaults(id: string): Params {
  const params = new Params(id);

  params.daySize = GraphBigInt.fromString("450");
  params.epochSize = GraphBigInt.fromString("9450");
  params.epochRewardAmount = GraphBigInt.fromString("400000000000000000000000");

  return params;
}

export function createNewParams(id: string): Params {
  const params = paramsDefaults(id);
  params.save();
  return params;
}
