"use client";

import { useEffect, useState } from "react";

type ServiceState = "checking" | "available" | "restricted" | "unavailable";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function isSafetySummary(value: unknown): value is { public: true; blocked: string[]; paused: string[]; workflowChangesEnabled: boolean; killSwitchActive: boolean } {
  if (typeof value !== "object" || value === null) return false;
  const summary = value as Record<string, unknown>;
  return summary.public === true && Array.isArray(summary.blocked) && Array.isArray(summary.paused)
    && typeof summary.workflowChangesEnabled === "boolean" && typeof summary.killSwitchActive === "boolean";
}

export default function PolicyServiceStatus() {
  const [state, setState] = useState<ServiceState>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    let active = true;

    async function checkPolicyService() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/system/safety`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const summary: unknown = await response.json();
        if (!response.ok || !isSafetySummary(summary)) throw new Error("Policy service returned an invalid response.");
        setState(summary.workflowChangesEnabled ? "available" : "restricted");
      } catch {
        if (active) setState("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkPolicyService();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  if (state === "checking") {
    return (
      <article className="status-card policy-status" aria-live="polite">
        <p className="card-label">Policy service</p>
        <h2>Checking safety rules</h2>
        <p>Verifying that the server-side policy service is reachable.</p>
      </article>
    );
  }

  if (state === "available") {
    return (
      <article className="status-card policy-status policy-status--available" aria-live="polite">
        <p className="card-label">Policy service</p>
        <h2>Safety rules online</h2>
        <p>Draft review and publication are checked by the server before a workflow can be enabled.</p>
      </article>
    );
  }

  if (state === "restricted") {
    return (
      <article className="status-card policy-status policy-status--restricted" role="alert">
        <p className="card-label">Policy service</p>
        <h2>Workflow changes paused</h2>
        <p>The operational safety control is active. Existing workflow details remain visible, but no draft can be created or published.</p>
      </article>
    );
  }

  return (
    <article className="status-card policy-status policy-status--unavailable" role="alert">
      <p className="card-label">Policy service</p>
      <h2>Safety rules unavailable</h2>
      <p>Draft review and publication remain unavailable until the server-side policy service is reachable.</p>
      <button type="button" onClick={() => setAttempt((current) => current + 1)}>Check again</button>
    </article>
  );
}
