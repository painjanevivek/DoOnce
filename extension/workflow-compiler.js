/* global module */

const workflowSpecFormat = "doonce.workflow-spec.v1";
const safeSelector = /^(?:#[a-zA-Z][a-zA-Z0-9_-]{0,63}|\[data-doonce-capture-id="[a-z0-9-]{1,64}"\])$/i;

function compileSafeCapture(summaries, { title = "Recorded browser workflow", idFactory = () => crypto.randomUUID() } = {}) {
  if (!Array.isArray(summaries) || summaries.length === 0 || summaries.length > 100) return { ok: false, errors: ["A capture must contain between 1 and 100 safe events."] };
  if (typeof title !== "string" || title.trim().length === 0 || title.length > 120) return { ok: false, errors: ["Workflow title must be between 1 and 120 characters."] };

  const first = summaries[0];
  const origin = safeOrigin(first?.origin);
  if (!origin) return { ok: false, errors: ["Capture origin is not supported."] };

  const steps = [];
  for (const [index, summary] of summaries.entries()) {
    if (!isSafeSummary(summary, origin)) return { ok: false, errors: [`Capture event ${index + 1} is not safe to compile.`] };
    const download = summary.actionHint === "download";
    steps.push({
      id: idFactory(),
      action: download ? "download" : "ask-approval",
      name: download ? "Download the verified report" : `Review recorded ${summary.eventKind}`,
      expectedOutcome: download ? "The expected report download is confirmed." : "An operator reviews this recorded action before it can run.",
      target: { domain: origin.hostname, path: summary.path, selector: summary.selector },
    });
  }

  return { ok: true, value: { format: workflowSpecFormat, title: title.trim(), allowedDomains: [origin.hostname], inputs: [], steps } };
}

function safeOrigin(value) {
  try {
    const origin = new URL(value);
    return origin.protocol === "https:" || (origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname)) ? origin : undefined;
  } catch {
    return undefined;
  }
}

function isSafeSummary(summary, origin) {
  return summary && typeof summary === "object" && summary.origin === origin.origin && typeof summary.path === "string" && summary.path.startsWith("/") && !summary.path.startsWith("//") && !summary.path.includes("..") && typeof summary.selector === "string" && safeSelector.test(summary.selector) && ["click", "change", "input"].includes(summary.eventKind) && (summary.actionHint === undefined || summary.actionHint === "download");
}

const DoOnceWorkflowCompiler = { compileSafeCapture, workflowSpecFormat };

if (typeof module !== "undefined") module.exports = DoOnceWorkflowCompiler;
