import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

import { Totals } from "../../../../generated/schema";
import { getTotalsIdDlp, TOTALS_ID_GLOBAL } from "./constants";

export function getOrCreateTotalsGlobal(): Totals {
  const totalsId = TOTALS_ID_GLOBAL;
  return getOrCreateTotals(totalsId);
}

export function getOrCreateTotalsForDlp(dlpId: string): Totals {
  const totalsId = getTotalsIdDlp(dlpId);
  return getOrCreateTotals(totalsId);
}

export function getOrCreateTotals(id: string): Totals {
  let totals = Totals.load(id);
  if (totals == null) {
    totals = new Totals(id);
    totals.totalFileContributions = GraphBigInt.zero();
    totals.uniqueFileContributors = GraphBigInt.zero();
    totals.save();
  }
  return totals;
}
