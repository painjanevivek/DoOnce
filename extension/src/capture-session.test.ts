import assert from "node:assert/strict";
import test from "node:test";
import type { RecordedAction } from "../../contracts/protocol";
import { acknowledgeCaptureBatch, appendCaptureAction, createCaptureSession, nextCaptureBatch, recoverCaptureSession, retryDelayMs, transitionCaptureSession } from "./capture-session";

const sessionId = "a0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b";
const firstAction = action("b0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", "input", "2026-08-09T00:00:01.000Z", 0);

test("runs the complete capture session lifecycle", () => {
  let session = createCaptureSession("https://example.com", "0.3.0", "2026-08-09T00:00:00.000Z", sessionId);
  session = appendCaptureAction(session, firstAction);
  session = transitionCaptureSession(session, "pause");
  assert.equal(appendCaptureAction(session, action("c0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", "click", "2026-08-09T00:00:02.000Z", 1)).actions.length, 1);
  session = transitionCaptureSession(session, "resume");
  session = transitionCaptureSession(session, "stop");
  session = transitionCaptureSession(session, "synchronize");
  const batch = nextCaptureBatch(session, true, "d0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b")!;
  session = acknowledgeCaptureBatch(session, batch, { schemaVersion: 1, sessionId, batchId: batch.batchId, acceptedThrough: 0, status: "finalized" });
  assert.equal(session.status, "finalized");
  assert.equal(recoverCaptureSession(session)?.id, sessionId);
});

test("coalesces noisy typing and duplicate click-change pairs", () => {
  let session = createCaptureSession("https://example.com", "0.3.0", "2026-08-09T00:00:00.000Z", sessionId);
  session = appendCaptureAction(session, firstAction);
  session = appendCaptureAction(session, action("c0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", "input", "2026-08-09T00:00:01.500Z", 1));
  assert.equal(session.actions.length, 1);
  assert.equal(session.actions[0]?.id, firstAction.id);
  session = appendCaptureAction(session, action("d0c4d3b2-9f6e-4a1d-b2c3-8a7d6e5f4a3b", "click", "2026-08-09T00:00:01.700Z", 2));
  assert.equal(session.actions.length, 1);
});

test("bounds synchronization backoff and rejects invalid recovery", () => {
  assert.equal(retryDelayMs(0), 500);
  assert.equal(retryDelayMs(20), 30_000);
  assert.equal(recoverCaptureSession({ status: "recording" }), undefined);
});

test("records a complete report-download demonstration without runner-specific state", () => {
  let session = createCaptureSession("https://example.com", "0.3.0", "2026-08-09T00:00:00.000Z", sessionId);
  session = appendCaptureAction(session, { schemaVersion: 1, id: crypto.randomUUID(), sequence: 0, occurredAt: "2026-08-09T00:00:01.000Z", origin: "https://example.com", path: "/reports", eventKind: "navigate" });
  session = appendCaptureAction(session, { ...action(crypto.randomUUID(), "click", "2026-08-09T00:00:02.000Z", 1), path: "/reports", actionHint: "download" });
  session = appendCaptureAction(session, { schemaVersion: 1, id: crypto.randomUUID(), sequence: 2, occurredAt: "2026-08-09T00:00:03.000Z", origin: "https://example.com", path: "/reports", eventKind: "download-start" });
  session = appendCaptureAction(session, { schemaVersion: 1, id: crypto.randomUUID(), sequence: 3, occurredAt: "2026-08-09T00:00:04.000Z", origin: "https://example.com", path: "/reports", eventKind: "download-complete" });
  session = transitionCaptureSession(session, "stop");
  assert.deepEqual(session.actions.map((item) => item.eventKind), ["navigate", "click", "download-start", "download-complete"]);
  assert.equal(session.actions.some((item) => "outcome" in item || "runner" in item), false);
  assert.equal(recoverCaptureSession(session)?.actions.length, 4);
});

test("keeps select and toggle controls as distinct semantic events", () => {
  let session = createCaptureSession("https://example.com", "0.3.0", "2026-08-09T00:00:00.000Z", sessionId);
  session = appendCaptureAction(session, action(crypto.randomUUID(), "select", "2026-08-09T00:00:01.000Z", 0));
  const toggle = action(crypto.randomUUID(), "toggle", "2026-08-09T00:00:03.000Z", 1);
  toggle.target = { ...toggle.target!, domFingerprint: "1234567890abcdef", tagName: "input", inputType: "checkbox" };
  session = appendCaptureAction(session, toggle);
  assert.deepEqual(session.actions.map((item) => item.eventKind), ["select", "toggle"]);
});

function action(id: string, eventKind: RecordedAction["eventKind"], occurredAt: string, sequence: number): RecordedAction {
  return {
    schemaVersion: 1, id, sequence, occurredAt, origin: "https://example.com", path: "/form", eventKind,
    locator: { schemaVersion: 1, primary: { strategy: "id", value: "#name", confidence: 1 }, fallbacks: [] },
    target: { tagName: "input", framePath: [], domFingerprint: "abcdef0123456789", visibility: { inViewport: true, ratio: 1, viewportWidth: 1200, viewportHeight: 800 }, locator: { schemaVersion: 1, primary: { strategy: "id", value: "#name", confidence: 1 }, fallbacks: [] } },
    value: { classification: "variable-candidate", placeholder: "{{name}}", length: 4 },
  };
}
