import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Totals } from "../../../../generated/schema";

export function totalsDefaults(id: string): Totals {
  const totals = new Totals(id);
  totals.totalFileContributions = GraphBigInt.zero();
  totals.uniqueFileContributors = GraphBigInt.zero();
  return totals;
}

export function createNewTotals(id: string): Totals {
  const totals = totalsDefaults(id);
  totals.save();
  return totals;
}
