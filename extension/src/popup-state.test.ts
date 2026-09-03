import assert from "node:assert/strict";
import test from "node:test";
import { derivePopupControls, derivePopupStates, popupStateLabel, type PopupStateInput } from "./popup-state";

const readyInput: PopupStateInput = {
  isConnected: true,
  hasConsentableTab: true,
  isPilotOrigin: true,
  isConsented: true,
  isRecording: false,
  sessionStatus: "stopped",
  hasOriginCaptureSession: true,
  hasCaptureData: true,
  canRun: true,
  hasRunApproval: false,
  receiptCount: 0,
};

test("popup states fail closed outside the approved pilot", () => {
  assert.deepEqual(derivePopupStates({
    ...readyInput,
    hasConsentableTab: true,
    isPilotOrigin: false,
    isRecording: true,
    hasRunApproval: true,
    receiptCount: 1,
  }), {
    connection: "connected",
    boundary: "outside-pilot",
    capture: "unavailable",
    run: "unavailable",
    receipt: "available",
  });
});

test("popup states expose an attended run only after explicit review", () => {
  assert.equal(derivePopupStates({ ...readyInput, hasRunApproval: false }).run, "awaiting-review");
  assert.equal(derivePopupStates({ ...readyInput, hasRunApproval: true }).run, "ready");
  assert.equal(popupStateLabel("awaiting-review"), "Review required");
});

test("popup controls require connection for new consent and prevent duplicate consent", () => {
  assert.equal(derivePopupControls({ ...readyInput, isConnected: false, isConsented: false }).consentDisabled, true);
  assert.equal(derivePopupControls({ ...readyInput, isConnected: true, isConsented: false }).consentDisabled, false);
  assert.equal(derivePopupControls(readyInput).consentDisabled, true);
  assert.deepEqual(
    {
      pairingCodeDisabled: derivePopupControls(readyInput).pairingCodeDisabled,
      pairDisabled: derivePopupControls(readyInput).pairDisabled,
      disconnectDisabled: derivePopupControls(readyInput).disconnectDisabled,
    },
    { pairingCodeDisabled: true, pairDisabled: true, disconnectDisabled: false },
  );
});

test("capture session actions are available only for the current origin's session", () => {
  const unrelated = derivePopupControls({ ...readyInput, hasOriginCaptureSession: false });
  assert.equal(unrelated.stopCaptureDisabled, true);
  assert.equal(unrelated.syncCaptureDisabled, true);
  assert.equal(unrelated.finalizeCaptureDisabled, true);
  assert.equal(unrelated.discardCaptureDisabled, true);

  const stopped = derivePopupControls(readyInput);
  assert.equal(stopped.stopCaptureDisabled, true);
  assert.equal(stopped.syncCaptureDisabled, false);
  assert.equal(stopped.finalizeCaptureDisabled, false);
  assert.equal(stopped.discardCaptureDisabled, false);
  assert.equal(stopped.exportCaptureDisabled, false);
});

test("recording can be retried after consent even when initial capture startup failed", () => {
  assert.equal(derivePopupControls({ ...readyInput, isRecording: false }).recordingDisabled, false);
});
