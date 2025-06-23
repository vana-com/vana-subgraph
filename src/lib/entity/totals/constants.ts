export const TOTALS_ID_GLOBAL = "global";

export function getTotalsIdDlp(dlpId: string): string {
  return `dlp-${dlpId}`;
}

export function getTotalsIdDlpEpoch(dlpId: string, epochId: string): string {
  return `dlp-${dlpId}-epoch-${epochId}`;
}
