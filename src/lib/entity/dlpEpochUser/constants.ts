export function getDlpEpochUserId(
  dlpId: string,
  epochId: string,
  userId: string,
): string {
  return `dlp-${dlpId}-epoch-${epochId}-user-${userId}`;
}
