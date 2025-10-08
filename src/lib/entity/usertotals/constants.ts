export function getUserTotalsId(userId: string): string {
  return `user-${userId}`;
}

export function getUserTotalsIdDlp(userId: string, dlpId: string): string {
  return `user-${userId}-dlp-${dlpId}`;
}

export function getUserTotalsIdSchemaIndependent(
  userId: string,
  schemaId: string,
): string {
  return `user-${userId}-schema-${schemaId}-independent`;
}


export function getUserTotalsIdSchemaGlobalIndependent(
    userId: string,
): string {
  return `user-${userId}-schema-global-independent`;
}
