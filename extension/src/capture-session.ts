import type { CaptureSession, CaptureSyncAck, CaptureSyncRequest, RecordedAction } from "../../contracts/protocol";
import { validateContract } from "../../contracts/validation";

export const captureBatchSize = 50;
export const maximumCaptureActions = 1000;

export type CaptureSessionEvent = "pause" | "resume" | "stop" | "synchronize" | "sync-failed" | "finalize" | "discard";

export function createCaptureSession(origin: string, extensionVersion: string, now = new Date().toISOString(), id = crypto.randomUUID()): CaptureSession {
  return {
    schemaVersion: 1,
    format: "doonce.capture-session.v1",
    id,
    startedAt: now,
    status: "recording",
    approvedOrigins: [origin],
    actions: [],
    extensionVersion,
    updatedAt: now,
    syncCursor: -1,
    retryCount: 0,
  };
}

export function transitionCaptureSession(session: CaptureSession, event: CaptureSessionEvent, now = new Date().toISOString()): CaptureSession {
  const nextStatus = transition(session.status, event);
  return {
    ...session,
    status: nextStatus,
    updatedAt: now,
    ...(nextStatus === "stopped" || nextStatus === "finalized" || nextStatus === "discarded" ? { endedAt: session.endedAt ?? now } : {}),
    ...(event === "sync-failed" ? { retryCount: Math.min((session.retryCount ?? 0) + 1, 20) } : {}),
    ...(event === "synchronize" || event === "finalize" ? { retryCount: 0 } : {}),
  };
}

export function appendCaptureAction(session: CaptureSession, action: RecordedAction): CaptureSession {
  if (session.status !== "recording") return session;
  if (!session.approvedOrigins.includes(action.origin)) throw new TypeError("The captured action is outside the approved session origins.");
  const expectedSequence = session.actions.length ? session.actions.at(-1)!.sequence + 1 : 0;
  const normalized = { ...action, sequence: expectedSequence };
  const actions = coalesceCaptureActions(session.actions, normalized).slice(-maximumCaptureActions);
  return { ...session, actions, updatedAt: normalized.occurredAt };
}

export function nextCaptureBatch(session: CaptureSession, final = false, batchId = crypto.randomUUID()): CaptureSyncRequest | undefined {
  const cursor = session.syncCursor ?? -1;
  const actions = session.actions.filter((action) => action.sequence > cursor).slice(0, captureBatchSize);
  if (actions.length === 0 && !final) return undefined;
  return { schemaVersion: 1, sessionId: session.id, batchId, cursor, actions, final };
}

export function acknowledgeCaptureBatch(session: CaptureSession, request: CaptureSyncRequest, ack: CaptureSyncAck, now = new Date().toISOString()): CaptureSession {
  if (ack.sessionId !== session.id || ack.batchId !== request.batchId || ack.acceptedThrough < (session.syncCursor ?? -1)) throw new TypeError("Capture synchronization acknowledgement is inconsistent.");
  const complete = request.final && ack.status === "finalized";
  return {
    ...session,
    status: complete ? "finalized" : session.status === "synchronizing" ? "stopped" : session.status,
    syncCursor: ack.acceptedThrough,
    retryCount: 0,
    updatedAt: now,
    ...(complete ? { endedAt: session.endedAt ?? now } : {}),
  };
}

export function recoverCaptureSession(input: unknown): CaptureSession | undefined {
  const result = validateContract<CaptureSession>("CaptureSession", input);
  return result.ok ? result.value : undefined;
}

export function retryDelayMs(retryCount: number): number {
  return Math.min(30_000, 500 * 2 ** Math.min(Math.max(retryCount, 0), 6));
}

export function coalesceCaptureActions(existing: readonly RecordedAction[], incoming: RecordedAction): RecordedAction[] {
  const actions = [...existing];
  const previous = actions.at(-1);
  if (!previous || !sameTarget(previous, incoming)) return [...actions, incoming];
  const elapsed = Date.parse(incoming.occurredAt) - Date.parse(previous.occurredAt);
  const inputEvents = new Set(["input", "change", "select", "toggle"]);
  if (elapsed >= 0 && elapsed <= 1_500 && inputEvents.has(previous.eventKind) && inputEvents.has(incoming.eventKind)) {
    const before = previous.before ?? incoming.before;
    actions[actions.length - 1] = { ...incoming, id: previous.id, sequence: previous.sequence, ...(before ? { before } : {}) };
    return actions;
  }
  if (elapsed >= 0 && elapsed <= 400 && ((previous.eventKind === "click" && inputEvents.has(incoming.eventKind)) || (inputEvents.has(previous.eventKind) && incoming.eventKind === "click"))) {
    const preferred = inputEvents.has(incoming.eventKind) ? incoming : previous;
    const before = previous.before ?? incoming.before;
    const after = incoming.after ?? previous.after;
    actions[actions.length - 1] = { ...preferred, id: previous.id, sequence: previous.sequence, ...(before ? { before } : {}), ...(after ? { after } : {}) };
    return actions;
  }
  return [...actions, incoming];
}

function sameTarget(left: RecordedAction, right: RecordedAction): boolean {
  const leftFingerprint = left.target?.domFingerprint ?? left.locator?.primary.value;
  const rightFingerprint = right.target?.domFingerprint ?? right.locator?.primary.value;
  return left.origin === right.origin && left.path === right.path && Boolean(leftFingerprint) && leftFingerprint === rightFingerprint;
}

function transition(status: CaptureSession["status"], event: CaptureSessionEvent): CaptureSession["status"] {
  const key = `${status}:${event}`;
  const transitions: Record<string, CaptureSession["status"]> = {
    "recording:pause": "paused", "recording:stop": "stopped", "recording:discard": "discarded",
    "paused:resume": "recording", "paused:stop": "stopped", "paused:discard": "discarded",
    "stopped:synchronize": "synchronizing", "stopped:finalize": "finalized", "stopped:discard": "discarded",
    "synchronizing:sync-failed": "stopped", "synchronizing:finalize": "finalized", "synchronizing:discard": "discarded",
  };
  const next = transitions[key];
  if (!next) throw new TypeError(`Capture session cannot ${event} while ${status}.`);
  return next;
}
