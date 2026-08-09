"use client";

import { useState } from "react";
import type { LocatorStrategy } from "../../../contracts/protocol";
import { buildCalibrationRequest, defaultCalibration, type CalibrationDraft, type VideoAction, type VisualObservation } from "./video-authoring-types";

const actions: Array<{ value: VideoAction; label: string }> = [
  { value: "navigate", label: "Open page" }, { value: "wait", label: "Wait for element" }, { value: "type", label: "Enter a value" },
  { value: "select", label: "Select a value" }, { value: "read", label: "Read a value" }, { value: "download", label: "Download file" },
];
const strategies: Array<{ value: LocatorStrategy; label: string }> = [
  { value: "role", label: "Accessible role + name" }, { value: "label", label: "Form label" }, { value: "text", label: "Visible text" }, { value: "id", label: "Stable element ID" },
];

export function VideoCalibrationPanel({ observations, busy, onCalibrate }: { observations: VisualObservation[]; busy: boolean; onCalibrate(input: unknown): Promise<void> }) {
  const [startingUrl, setStartingUrl] = useState("");
  const [drafts, setDrafts] = useState<Record<string, CalibrationDraft>>(() => Object.fromEntries(observations.map((item) => [item.id, defaultCalibration(item, "")])));

  function update(id: string, patch: Partial<CalibrationDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id]!, ...patch } }));
  }

  function applyStartingUrl(value: string) {
    setStartingUrl(value);
    try {
      const url = new URL(value);
      setDrafts((current) => Object.fromEntries(Object.entries(current).map(([id, draft]) => [id, { ...draft, domain: url.hostname, path: url.pathname || "/" }])));
    } catch { /* Keep the user's unfinished URL without changing existing mappings. */ }
  }

  const included = observations.filter((item) => drafts[item.id]?.included);
  const complete = startingUrl.trim().length > 0 && included.length > 0 && included.every((item) => {
    const draft = drafts[item.id]!;
    return draft.domain.trim().length > 0 && draft.path.startsWith("/") && (draft.action === "navigate" || draft.locatorValue.trim().length > 0);
  });

  return (
    <section className="video-calibration" aria-labelledby="video-calibration-title">
      <header><p className="eyebrow">Calibration</p><h3 id="video-calibration-title">Connect visual moments to live page elements</h3><p>Coordinates and OCR are only visual clues. Choose a semantic locator that can survive layout and screen-size changes.</p></header>
      <label className="editor-field"><span>Starting page</span><input type="url" maxLength={2048} placeholder="https://app.example.com/start" value={startingUrl} onChange={(event) => applyStartingUrl(event.target.value)} /></label>
      <ol className="video-observations">
        {observations.map((observation) => {
          const draft = drafts[observation.id]!;
          return <li key={observation.id} data-included={draft.included}>
            <details open={observation.sequence === 0}>
              <summary><span><b>{formatTime(observation.atMs)}</b><strong>{observation.description}</strong><small>{Math.round(observation.confidence * 100)}% visual confidence</small></span><em>{draft.included ? actionLabel(draft.action) : "Excluded"}</em></summary>
              <div className="video-observation__body">
                <label className="video-include"><input type="checkbox" checked={draft.included} onChange={(event) => update(observation.id, { included: event.target.checked })} /><span>Include this moment as a workflow step</span></label>
                {observation.textHints.length > 0 && <p className="video-ocr"><b>Visible text:</b> {observation.textHints.join(" · ")}</p>}
                {observation.normalizedBounds && <p className="video-coordinate-note">A screen region was detected. It will not be saved as an executable locator.</p>}
                {draft.included && <div className="video-calibration-grid">
                  <label><span>Action</span><select value={draft.action} onChange={(event) => update(observation.id, { action: event.target.value as VideoAction })}>{actions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
                  <label><span>Domain</span><input maxLength={253} value={draft.domain} onChange={(event) => update(observation.id, { domain: event.target.value })} /></label>
                  <label><span>Page path</span><input maxLength={2048} value={draft.path} onChange={(event) => update(observation.id, { path: event.target.value })} /></label>
                  {draft.action !== "navigate" && <>
                    <label><span>Locator method</span><select value={draft.locatorStrategy} onChange={(event) => update(observation.id, { locatorStrategy: event.target.value as LocatorStrategy })}>{strategies.map((strategy) => <option key={strategy.value} value={strategy.value}>{strategy.label}</option>)}</select></label>
                    <label className="video-calibration-grid__wide"><span>Semantic locator value</span><input maxLength={512} placeholder="Example: textbox:Account name" value={draft.locatorValue} onChange={(event) => update(observation.id, { locatorValue: event.target.value })} /></label>
                  </>}
                  {["type", "select", "read"].includes(draft.action) && <label><span>{draft.action === "read" ? "Output name" : "Reusable input name"}</span><input maxLength={64} value={draft.variableName} onChange={(event) => update(observation.id, { variableName: event.target.value })} /></label>}
                </div>}
              </div>
            </details>
          </li>;
        })}
      </ol>
      <div className="run-launcher__actions"><button className="primary-button" disabled={!complete || busy} type="button" onClick={() => void onCalibrate(buildCalibrationRequest(startingUrl, observations, drafts))}>{busy ? "Saving calibration…" : `Save ${included.length} calibrated step${included.length === 1 ? "" : "s"}`}</button></div>
    </section>
  );
}

function actionLabel(value: VideoAction): string { return actions.find((item) => item.value === value)?.label ?? value; }
function formatTime(milliseconds: number): string { const seconds = Math.max(0, Math.round(milliseconds / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
