function isReceipt(receipt) {
  return receipt && typeof receipt === "object"
    && ["completed", "paused"].includes(receipt.outcome)
    && typeof receipt.finishedAt === "string"
    && !Number.isNaN(Date.parse(receipt.finishedAt))
    && (receipt.outcome !== "paused" || (typeof receipt.pauseReason === "string" && receipt.pauseReason.length > 0 && receipt.pauseReason.length <= 160));
}

function describeReceipt(receipt) {
  if (!isReceipt(receipt)) return "No verified local receipt is available.";
  const completedAt = new Date(receipt.finishedAt).toLocaleString();
  if (receipt.outcome === "completed") return `Last local receipt: completed at ${completedAt}. Demo download verified.`;
  return `Last local receipt: paused at ${completedAt}. Reason: ${receipt.pauseReason}`;
}

const DoOnceReceiptView = { describeReceipt, isReceipt };

if (typeof module !== "undefined") module.exports = DoOnceReceiptView;
