export function getUserTotalsId(userId: string): string {
  return `user-${userId}`;
}

export function getUserTotalsIdDlp(userId: string, dlpId: string): string {
  return `user-${userId}-dlp-${dlpId}`;
}
