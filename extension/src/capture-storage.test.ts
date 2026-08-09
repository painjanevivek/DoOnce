import assert from "node:assert/strict";
import test from "node:test";
import type { CaptureHandshake, CaptureSyncRequest } from "../../contracts/protocol";
import { createCaptureSession, transitionCaptureSession } from "./capture-session";
import { discardCaptureSession, loadCaptureSession, saveCaptureSession, type CaptureStorageArea } from "./capture-storage";
import { synchronizeCaptureSession, type CaptureTransport } from "./capture-sync";

test("recovers an active session after service-worker suspension", async () => {
  const storage = memoryStorage();
  const session = createCaptureSession("https://example.com", "0.3.0", "2026-08-09T00:00:00.000Z", "a0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b");
  await saveCaptureSession(storage, session);
  assert.equal((await loadCaptureSession(storage))?.status, "recording");
  await discardCaptureSession(storage);
  assert.equal(await loadCaptureSession(storage), undefined);
});

test("retains a stopped session when synchronization is offline", async () => {
  const stopped = transitionCaptureSession(createCaptureSession("https://example.com", "0.3.0"), "stop");
  const offline: CaptureTransport = { handshake: async () => { throw new Error("offline"); }, sendBatch: async () => { throw new Error("offline"); } };
  const result = await synchronizeCaptureSession(stopped, offline, true);
  assert.equal(result.status, "stopped");
  assert.equal(result.retryCount, 1);
});

test("finalizes an empty stopped session after a compatible handshake", async () => {
  const stopped = transitionCaptureSession(createCaptureSession("https://example.com", "0.3.0"), "stop");
  const transport: CaptureTransport = {
    handshake: async (value: CaptureHandshake) => value,
    sendBatch: async (request: CaptureSyncRequest) => ({ schemaVersion: 1, sessionId: request.sessionId, batchId: request.batchId, acceptedThrough: request.cursor, status: "finalized" }),
  };
  assert.equal((await synchronizeCaptureSession(stopped, transport, true)).status, "finalized");
});

function memoryStorage(): CaptureStorageArea {
  const state: Record<string, unknown> = {};
  return {
    async get(keys) { const names = Array.isArray(keys) ? keys : [keys]; return Object.fromEntries(names.map((key) => [key, state[key]])); },
    async set(items) { Object.assign(state, items); },
    async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key]; },
  };
}
