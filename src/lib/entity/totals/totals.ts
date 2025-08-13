import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { BigDecimal as GraphBigDecimal } from "@graphprotocol/graph-ts";

import { Totals } from "../../../../generated/schema";
import { getTotalsDlpEpochPerformanceId, TOTALS_ID_GLOBAL } from "./constants";

export function getOrCreateTotalsGlobal(): Totals {
  return getOrCreateTotals(TOTALS_ID_GLOBAL);
}

export function getOrCreateTotalsForDlpEpochPerformance(
  dlpId: string,
  epochId: string,
): Totals {
  const totalsId = getTotalsDlpEpochPerformanceId(dlpId, epochId);
  return getOrCreateTotals(totalsId);
}

export function getOrCreateTotals(id: string): Totals {
  let totals = Totals.load(id);
  if (totals == null) {
    totals = new Totals(id);
    totals.totalFileContributions = GraphBigInt.zero();
    totals.uniqueFileContributors = GraphBigInt.zero();
    totals.dataAccessFees = GraphBigDecimal.zero();
    totals.save();
  }
  return totals;
}
