import type { CaptureSession } from "../../contracts/protocol";
import { recoverCaptureSession } from "./capture-session";

export const captureSessionStorageKey = "doonce.captureSession.v1";

export interface CaptureStorageArea {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export async function loadCaptureSession(storage: CaptureStorageArea): Promise<CaptureSession | undefined> {
  const stored = await storage.get(captureSessionStorageKey);
  return recoverCaptureSession(stored[captureSessionStorageKey]);
}

export async function saveCaptureSession(storage: CaptureStorageArea, session: CaptureSession): Promise<void> {
  const recovered = recoverCaptureSession(session);
  if (!recovered) throw new TypeError("Capture session is invalid and was not stored.");
  await storage.set({ [captureSessionStorageKey]: recovered });
}

export async function discardCaptureSession(storage: CaptureStorageArea): Promise<void> {
  await storage.remove(captureSessionStorageKey);
}
