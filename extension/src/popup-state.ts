export type PopupConnectionState = "disconnected" | "connected";
export type PopupBoundaryState = "no-tab" | "outside-pilot" | "awaiting-consent" | "approved";
export type PopupCaptureState = "unavailable" | "idle" | "recording" | "paused" | "stopped" | "finalized" | "discarded";
export type PopupRunState = "unavailable" | "awaiting-review" | "ready";
export type PopupReceiptState = "empty" | "available";

export interface PopupStateInput {
  isConnected: boolean;
  hasConsentableTab: boolean;
  isPilotOrigin: boolean;
  isConsented: boolean;
  isRecording: boolean;
  sessionStatus?: string;
  hasOriginCaptureSession: boolean;
  hasCaptureData: boolean;
  canRun: boolean;
  hasRunApproval: boolean;
  receiptCount: number;
}

export interface PopupStates {
  connection: PopupConnectionState;
  boundary: PopupBoundaryState;
  capture: PopupCaptureState;
  run: PopupRunState;
  receipt: PopupReceiptState;
}

export interface PopupControls {
  pairingCodeDisabled: boolean;
  pairDisabled: boolean;
  disconnectDisabled: boolean;
  consentDisabled: boolean;
  recordingDisabled: boolean;
  stopCaptureDisabled: boolean;
  syncCaptureDisabled: boolean;
  finalizeCaptureDisabled: boolean;
  discardCaptureDisabled: boolean;
  exportCaptureDisabled: boolean;
  runApprovalDisabled: boolean;
  runDisabled: boolean;
  exportReceiptsDisabled: boolean;
  revokeDisabled: boolean;
}

export function derivePopupStates(input: PopupStateInput): PopupStates {
  const boundary: PopupBoundaryState = !input.hasConsentableTab
    ? "no-tab"
    : !input.isPilotOrigin
      ? "outside-pilot"
      : !input.isConsented
        ? "awaiting-consent"
        : "approved";
  const capture: PopupCaptureState = boundary !== "approved"
    ? "unavailable"
    : input.sessionStatus === "finalized"
      ? "finalized"
      : input.sessionStatus === "discarded"
        ? "discarded"
        : input.sessionStatus === "stopped"
          ? "stopped"
          : input.isRecording
            ? "recording"
            : input.sessionStatus === "paused"
              ? "paused"
              : "idle";
  const run: PopupRunState = boundary !== "approved" || !input.canRun
    ? "unavailable"
    : input.hasRunApproval
      ? "ready"
      : "awaiting-review";

  return {
    connection: input.isConnected ? "connected" : "disconnected",
    boundary,
    capture,
    run,
    receipt: input.receiptCount > 0 ? "available" : "empty",
  };
}

export function derivePopupControls(input: PopupStateInput): PopupControls {
  const hasOriginSession = input.hasOriginCaptureSession;
  const sessionCanStop = input.sessionStatus === "recording" || input.sessionStatus === "paused";
  const sessionCanSync = hasOriginSession && input.sessionStatus !== "discarded" && input.sessionStatus !== "finalized";

  return {
    pairingCodeDisabled: input.isConnected,
    pairDisabled: input.isConnected,
    disconnectDisabled: !input.isConnected,
    consentDisabled: !input.isConnected || !input.hasConsentableTab || !input.isPilotOrigin || input.isConsented,
    recordingDisabled: !input.isPilotOrigin || !input.isConsented,
    stopCaptureDisabled: !hasOriginSession || !sessionCanStop,
    syncCaptureDisabled: !sessionCanSync,
    finalizeCaptureDisabled: !hasOriginSession || input.sessionStatus !== "stopped",
    discardCaptureDisabled: !hasOriginSession,
    exportCaptureDisabled: !input.hasCaptureData,
    runApprovalDisabled: !input.canRun,
    runDisabled: !input.canRun || !input.hasRunApproval,
    exportReceiptsDisabled: input.receiptCount === 0,
    revokeDisabled: !input.isConsented,
  };
}

export function popupStateLabel(state: PopupConnectionState | PopupBoundaryState | PopupCaptureState | PopupRunState | PopupReceiptState): string {
  const labels: Record<PopupConnectionState | PopupBoundaryState | PopupCaptureState | PopupRunState | PopupReceiptState, string> = {
    disconnected: "Not connected",
    connected: "Connected",
    "no-tab": "Waiting for an approved tab",
    "outside-pilot": "Outside the approved pilot",
    "awaiting-consent": "Approval needed",
    approved: "Approved site",
    unavailable: "Unavailable",
    idle: "Ready to record",
    recording: "Recording in this tab",
    paused: "Recording paused",
    stopped: "Ready to review",
    finalized: "Capture finalized",
    discarded: "Capture discarded",
    "awaiting-review": "Review required",
    ready: "One run approved",
    empty: "No receipt yet",
    available: "Verified receipt available",
  };
  return labels[state];
}
