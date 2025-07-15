export const TOTALS_ID_GLOBAL = "global";

export function getTotalsDlpId(dlpId: string): string {
  return `dlp-${dlpId}`;
}

export function getTotalsDlpEpochPerformanceId(dlpId: string, epochId: string): string {
  return `performance-dlp-${dlpId}-epoch-${epochId}`;
}
