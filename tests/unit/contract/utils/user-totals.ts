import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { UserTotals } from "../../../../generated/schema";

export function userTotalsDefaults(id: string): UserTotals {
  const totals = new UserTotals(id);
  totals.activeStakedAmount = GraphBigInt.zero();
  totals.delegatedStakedAmount = GraphBigInt.zero();
  totals.activeStakesCount = GraphBigInt.zero();
  totals.delegatedStakesCount = GraphBigInt.zero();
  totals.fileContributionsCount = GraphBigInt.zero();
  return totals;
}

export function createNewUserTotals(id: string): UserTotals {
  const totals = userTotalsDefaults(id);
  totals.save();
  return totals;
}
