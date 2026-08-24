"use client";

import { useEffect, useState } from "react";
import { isSystemCapabilities, type SystemCapabilities } from "../workflows/authoring-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export function PilotBoundaryNote() {
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${apiBaseUrl}/api/v1/system/capabilities`, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok || !isSystemCapabilities(body)) throw new TypeError("Pilot boundary unavailable.");
        setCapabilities(body);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setUnavailable(true);
      });
    return () => controller.abort();
  }, []);

  if (unavailable) return <p className="pilot-boundary-note" role="status">The API has not confirmed the pilot site. Do not record or run a workflow until the exact site appears here.</p>;
  if (!capabilities) return <p className="pilot-boundary-note" aria-busy="true">Confirming the exact pilot site…</p>;
  if (!capabilities.mvp.enabled || !capabilities.mvp.pilotOrigin) return null;

  return (
    <aside className="pilot-boundary-note" aria-label="Approved MVP pilot scope">
      <span>Approved site</span>
      <strong>{capabilities.mvp.pilotOrigin}</strong>
      <small>Expected result: one verified report download in attended Chrome.</small>
    </aside>
  );
}
