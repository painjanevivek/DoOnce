import type { CaptureHandshake, CaptureSession, CaptureSyncAck, CaptureSyncRequest } from "../../contracts/protocol";
import { validateContract } from "../../contracts/validation-runtime";
import { acknowledgeCaptureBatch, nextCaptureBatch, transitionCaptureSession } from "./capture-session";

export interface CaptureTransport {
  handshake(handshake: CaptureHandshake): Promise<unknown>;
  sendBatch(request: CaptureSyncRequest): Promise<unknown>;
}

export const extensionCaptureHandshake: CaptureHandshake = {
  schemaVersion: 1,
  extensionVersion: "0.3.0",
  capabilities: ["semantic-elements", "frames", "shadow-dom", "navigation", "downloads", "tabs", "offline-buffer"],
  maxBatchSize: 50,
};

export async function synchronizeCaptureSession(session: CaptureSession, transport: CaptureTransport, final = false): Promise<CaptureSession> {
  if (final && session.status !== "stopped" && session.status !== "synchronizing") throw new TypeError("A capture session must be stopped before finalization.");
  let current = session.status === "stopped" ? transitionCaptureSession(session, "synchronize") : session;
  try {
    const handshake = validateContract<CaptureHandshake>("CaptureHandshake", await transport.handshake(extensionCaptureHandshake));
    if (!handshake.ok || handshake.value.schemaVersion !== session.schemaVersion) throw new TypeError("Capture protocol handshake failed.");
    while (true) {
      const request = nextCaptureBatch(current, final);
      if (!request) return current.status === "synchronizing" ? { ...current, status: "stopped" } : current;
      const parsed = validateContract<CaptureSyncAck>("CaptureSyncAck", await transport.sendBatch(request));
      if (!parsed.ok) throw new TypeError("Capture synchronization acknowledgement is invalid.");
      current = acknowledgeCaptureBatch(current, request, parsed.value);
      if (request.actions.length === 0 || parsed.value.status === "finalized") return current;
      if (request.actions.length < extensionCaptureHandshake.maxBatchSize && !final) return current;
    }
  } catch {
    return current.status === "synchronizing"
      ? transitionCaptureSession(current, "sync-failed")
      : { ...current, retryCount: Math.min((current.retryCount ?? 0) + 1, 20) };
  }
}

export function createHttpCaptureTransport(apiBaseUrl: string, token?: string): CaptureTransport {
  const headers = (includeAuthorization: boolean): Record<string, string> => ({ "Content-Type": "application/json", Accept: "application/json", ...(includeAuthorization && token ? { Authorization: `Bearer ${token}` } : {}) });
  return {
    async handshake(handshake) {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions/handshake`, { method: "POST", credentials: "include", headers: headers(false), body: JSON.stringify(handshake) });
      if (!response.ok) throw new TypeError("Capture handshake was rejected.");
      return response.json();
    },
    async sendBatch(request) {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions/${request.sessionId}/sync`, { method: "POST", credentials: "include", headers: headers(true), body: JSON.stringify(request) });
      if (!response.ok) throw new TypeError("Capture batch was rejected.");
      return response.json();
    },
  };
}
