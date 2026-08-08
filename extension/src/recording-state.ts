interface OriginRecord {
  origin?: unknown;
}

export function isRecording(recordingOrigins: unknown, origin: string): boolean {
  return Array.isArray(recordingOrigins) && recordingOrigins.includes(origin);
}

export function setRecording(recordingOrigins: unknown, origin: string, enabled: boolean): string[] {
  const origins = new Set(Array.isArray(recordingOrigins) ? recordingOrigins.filter((value): value is string => typeof value === "string") : []);
  if (enabled) origins.add(origin);
  else origins.delete(origin);
  return [...origins];
}

export function removeOriginData(records: unknown, origin: string): OriginRecord[] {
  return Array.isArray(records) ? records.filter((record): record is OriginRecord => typeof record === "object" && record !== null && (record as OriginRecord).origin !== origin) : [];
}
