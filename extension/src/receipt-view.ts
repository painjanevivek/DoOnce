import type { PauseReason } from "./run-notification";

export interface LocalReceipt {
  origin?: string;
  outcome: "completed" | "paused";
  pauseReason?: PauseReason;
  finishedAt: string;
}

export function isReceipt(value: unknown): value is LocalReceipt {
  if (typeof value !== "object" || value === null) return false;
  const receipt = value as Record<string, unknown>;
  return (receipt.outcome === "completed" || receipt.outcome === "paused")
    && typeof receipt.finishedAt === "string"
    && !Number.isNaN(Date.parse(receipt.finishedAt))
    && (receipt.outcome === "paused" ? isPauseReason(receipt.pauseReason) : receipt.pauseReason === undefined);
}

export function describeReceipt(receipt: unknown): string {
  if (!isReceipt(receipt)) return "No verified local receipt is available.";
  const completedAt = new Date(receipt.finishedAt).toLocaleString();
  if (receipt.outcome === "completed") return `Last local receipt: completed at ${completedAt}. Demo download verified.`;
  return `Last local receipt: paused at ${completedAt}. Reason: ${describePauseReason(receipt.pauseReason)}`;
}

export function describePauseReason(reason: unknown): string {
  if (reason === "changed-page") return "The expected page control changed.";
  if (reason === "slow-network") return "The expected confirmation did not arrive in time.";
  return "The run could not be verified.";
}

function isPauseReason(value: unknown): value is PauseReason {
  return value === "changed-page" || value === "slow-network" || value === "unknown";
}
