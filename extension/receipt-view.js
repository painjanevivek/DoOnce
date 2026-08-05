const pauseReasons = new Set(["changed-page", "slow-network", "unknown"]);

function isReceipt(receipt) {
  return receipt && typeof receipt === "object"
    && ["completed", "paused"].includes(receipt.outcome)
    && typeof receipt.finishedAt === "string"
    && !Number.isNaN(Date.parse(receipt.finishedAt))
    && (receipt.outcome === "paused" ? pauseReasons.has(receipt.pauseReason) : receipt.pauseReason === undefined);
}

function describeReceipt(receipt) {
  if (!isReceipt(receipt)) return "No verified local receipt is available.";
  const completedAt = new Date(receipt.finishedAt).toLocaleString();
  if (receipt.outcome === "completed") return `Last local receipt: completed at ${completedAt}. Demo download verified.`;
  return `Last local receipt: paused at ${completedAt}. Reason: ${describePauseReason(receipt.pauseReason)}`;
}

function describePauseReason(reason) {
  return ({ "changed-page": "The expected page control changed.", "slow-network": "The expected confirmation did not arrive in time.", unknown: "The run could not be verified." })[reason] ?? "The run could not be verified.";
}

const DoOnceReceiptView = { describeReceipt, describePauseReason, isReceipt };

if (typeof module !== "undefined") module.exports = DoOnceReceiptView;
