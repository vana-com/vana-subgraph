export function getUserTotalsId(userId: string): string {
  return `user-${userId}`;
}

export function getUserTotalsIdDlp(userId: string, dlpId: string): string {
  return `user-${userId}-dlp-${dlpId}`;
}

export function getUserTotalsIdSchema(userId: string, schemaId: string): string {
  return `user-${userId}-schema-${schemaId}`;
}

export function getUserTotalsIdGlobalSchema(userId: string): string {
  return `user-${userId}-global-schema`;
}
