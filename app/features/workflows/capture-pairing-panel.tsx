"use client";

import { useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export function CapturePairingPanel() {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);

  async function createCode() {
    setState("loading");
    setPairing(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions/pairing-codes`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (!response.ok || !isPairing(body)) throw new TypeError("Pairing code was not confirmed.");
      setPairing(body);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return (
    <details className="workflow-pairing">
      <summary>Connect the browser recorder</summary>
      <p>Generate a one-time code, open the DoOnce extension, and enter it there. The code expires after ten minutes and cannot be reused.</p>
      <button disabled={state === "loading"} onClick={() => void createCode()} type="button">{state === "loading" ? "Generating…" : "Generate pairing code"}</button>
      {pairing && <output aria-live="polite"><strong>{pairing.code}</strong><small>Expires {new Date(pairing.expiresAt).toLocaleTimeString()}.</small></output>}
      {state === "error" && <p role="alert">A pairing code could not be generated. Confirm that you are signed in, then try again.</p>}
    </details>
  );
}

function isPairing(value: unknown): value is { code: string; expiresAt: string } {
  return typeof value === "object" && value !== null && typeof (value as { code?: unknown }).code === "string" && typeof (value as { expiresAt?: unknown }).expiresAt === "string";
}
