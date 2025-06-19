export const TOTALS_ID_GLOBAL = "global";

export function getTotalsIdDlp(dlpId: string): string {
  return `dlp-${dlpId}`;
}
export function getTotalsIdEpochDlp(epochId: string, dlpId: string): string {
  return `epoch-${epochId}-dlp-${dlpId}`;
}
