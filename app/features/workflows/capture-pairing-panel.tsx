"use client";

import { useCallback, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export function CapturePairingPanel() {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>({ connected: false });
  const [clock, setClock] = useState(0);

  const loadConnection = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions/connection`, { credentials: "include", headers: { Accept: "application/json" } });
      const body: unknown = await response.json();
      if (response.ok && isConnection(body)) {
        setConnection(body.connection);
        if (body.connection.connected) setPairing(null);
      }
    } catch { /* A disconnected API must not be presented as a connected extension. */ }
  }, []);

  useEffect(() => {
    const immediate = window.setTimeout(() => { setClock(Date.now()); void loadConnection(); }, 0);
    const timer = window.setInterval(() => { setClock(Date.now()); void loadConnection(); }, pairing ? 2_000 : 15_000);
    return () => { window.clearTimeout(immediate); window.clearInterval(timer); };
  }, [loadConnection, pairing]);

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
    <details className="workflow-pairing" open={!connection.connected}>
      <summary>{connection.connected ? "Browser recorder connected" : "Connect the browser recorder"}</summary>
      {connection.connected ? <div className="pairing-connected" role="status"><strong>Connected extension {connection.extensionVersion ? `v${connection.extensionVersion}` : ""}</strong><small>Last confirmed {connection.lastSeenAt ? new Date(connection.lastSeenAt).toLocaleString() : "during pairing"}. Server confirmation—not local browser state—unlocks synchronization.</small></div> : <p>Generate a one-time code, open the DoOnce extension, and enter it there. The code expires after ten minutes and cannot be reused.</p>}
      {!connection.connected && <button disabled={state === "loading"} onClick={() => void createCode()} type="button">{state === "loading" ? "Generating…" : pairing && clock > 0 && Date.parse(pairing.expiresAt) <= clock ? "Generate fresh code" : "Generate pairing code"}</button>}
      {pairing && <output aria-live="polite"><strong>{pairing.code}</strong><small>{clock > 0 && Date.parse(pairing.expiresAt) <= clock ? "Expired. Generate a fresh code." : `Expires ${new Date(pairing.expiresAt).toLocaleTimeString()}. Waiting for server-confirmed connection…`}</small></output>}
      {state === "error" && <p role="alert">A pairing code could not be generated. Confirm that you are signed in, then try again.</p>}
    </details>
  );
}

interface ConnectionStatus { connected: boolean; extensionVersion?: string; pairedAt?: string; lastSeenAt?: string }

function isPairing(value: unknown): value is { code: string; expiresAt: string } {
  return typeof value === "object" && value !== null && typeof (value as { code?: unknown }).code === "string" && typeof (value as { expiresAt?: unknown }).expiresAt === "string";
}

function isConnection(value: unknown): value is { connection: ConnectionStatus } {
  if (!value || typeof value !== "object") return false;
  const connection = (value as { connection?: unknown }).connection;
  return Boolean(connection && typeof connection === "object" && typeof (connection as ConnectionStatus).connected === "boolean");
}
