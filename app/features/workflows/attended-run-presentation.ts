export type AttendedRunStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type AttendedRunPresentation = {
  nextAction: string;
  title: string;
  tone: "info" | "success" | "warning" | "error";
};

/**
 * Maps only server-returned run state to participant-facing guidance. A reason
 * code remains an opaque diagnostic value because the client cannot safely
 * infer a more specific browser or verification event from it.
 */
export function presentAttendedRun(
  status: AttendedRunStatus,
  reasonCode?: string,
): AttendedRunPresentation {
  const reason = reasonCode ? ` Diagnostic code: ${reasonCode}.` : "";
  switch (status) {
    case "queued":
      return {
        tone: "info",
        title: "Run queued",
        nextAction: "Keep Chrome open on the approved report page while the extension starts.",
      };
    case "running":
      return {
        tone: "info",
        title: "Run in progress",
        nextAction: "Stay present for any sign-in, MFA, or interruption. Do not repeat the action in another tab.",
      };
    case "paused":
      return {
        tone: "warning",
        title: "Run paused safely",
        nextAction: `Review the pause and continue only after the required manual action or new approval.${reason}`,
      };
    case "completed":
      return {
        tone: "success",
        title: "Run completed",
        nextAction: "Open the receipt evidence to confirm the recorded artifact and verification details before relying on this run.",
      };
    case "failed":
      return {
        tone: "error",
        title: "Run failed",
        nextAction: `Review the receipt timeline before creating or publishing a repair draft.${reason}`,
      };
    case "cancelled":
      return {
        tone: "warning",
        title: "Run cancelled",
        nextAction: "Review the receipt timeline. A new run requires a fresh approval.",
      };
  }
}
