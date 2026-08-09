"use client";

import { useRef, useState } from "react";
import type { CaptureSessionSummary } from "../../../contracts/protocol";
import { validateContract } from "../../../contracts/validation";
import { createVideoImport, getVideoImport, uploadVideo } from "./resumable-video-upload";
import { VideoCalibrationPanel } from "./video-calibration-panel";
import { isVideoResponse, readApiError, type VideoImport, type VideoMode } from "./video-authoring-types";

const maxBytes = 500 * 1024 * 1024;

export function VideoAuthoringPanel({ apiBaseUrl, onDraftCreated }: { apiBaseUrl: string; onDraftCreated(): void }) {
  const [mode, setMode] = useState<VideoMode>("pure-video");
  const [file, setFile] = useState<File | null>(null);
  const [captureSessionId, setCaptureSessionId] = useState("");
  const [sessions, setSessions] = useState<CaptureSessionSummary[]>([]);
  const [video, setVideo] = useState<VideoImport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);

  async function chooseMode(value: VideoMode) {
    setMode(value); setMessage("");
    if (value !== "video-with-telemetry" || sessions.length > 0) return;
    try { setSessions(await fetchSessions(apiBaseUrl)); }
    catch { setMessage("Synchronized recorder sessions are temporarily unavailable."); }
  }

  async function start() {
    if (!file) return;
    const contentType = videoContentType(file);
    if (!contentType || file.size < 1 || file.size > maxBytes) return setMessage("Choose an MP4, WebM, or QuickTime video no larger than 500 MiB.");
    if (mode === "video-with-telemetry" && !captureSessionId) return setMessage("Choose the finalized recorder session synchronized with this video.");
    setBusy(true); setMessage("Preparing resumable upload…");
    const abort = new AbortController(); controller.current = abort;
    const storageKey = resumeKey(file, mode, captureSessionId);
    try {
      let current = await resumeOrCreate(apiBaseUrl, storageKey, file, contentType, mode, captureSessionId, abort.signal);
      setVideo(current); window.localStorage.setItem(storageKey, current.id);
      if (current.status === "uploading") {
        setMessage(current.uploadedBytes > 0 ? "Resuming upload from the last confirmed chunk…" : "Uploading in verified chunks…");
        current = await uploadVideo(apiBaseUrl, file, current, setVideo, abort.signal);
        current = await mutateVideo(apiBaseUrl, current.id, "complete", undefined, abort.signal);
        setVideo(current);
      }
      if (current.status === "uploaded") {
        setMessage("Video verified. Analysis is running in the background…");
        await mutateVideo(apiBaseUrl, current.id, "analyze", undefined, abort.signal);
      }
      if (["uploaded", "analyzing"].includes(current.status)) current = await pollVideo(apiBaseUrl, current.id, setVideo, abort.signal);
      setVideo(current); window.localStorage.removeItem(storageKey);
      if (current.status === "completed") { setMessage("The synchronized telemetry produced an editable workflow draft."); onDraftCreated(); }
      else if (current.status === "needs-calibration") setMessage("Visual moments are ready. Calibrate only the steps you want in the draft.");
      else if (current.status === "needs-input") setMessage("No reliable page changes were detected. Try a clearer recording or use synchronized telemetry.");
      else if (current.status === "failed") setMessage("Analysis failed without creating a workflow. Confirm that the media tools are available, then retry with a supported video.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(error instanceof Error ? error.message : "The video could not be processed.");
    } finally { controller.current = null; setBusy(false); }
  }

  async function calibrate(input: unknown) {
    if (!video) return;
    setBusy(true); setMessage("");
    try { const calibrated = await mutateVideo(apiBaseUrl, video.id, "calibrate", input); setVideo(calibrated); setMessage("Calibration saved. Review the timeline once more, then create the editable draft."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Calibration could not be saved."); }
    finally { setBusy(false); }
  }

  async function compile() {
    if (!video) return;
    setBusy(true); setMessage("");
    try { const completed = await mutateVideo(apiBaseUrl, video.id, "compile"); setVideo(completed); setMessage("Editable draft created from the calibrated demonstration."); onDraftCreated(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The calibrated timeline could not be compiled."); }
    finally { setBusy(false); }
  }

  const progress = video ? Math.min(100, Math.round((video.uploadedBytes / Math.max(video.byteSize, 1)) * 100)) : 0;
  return (
    <details className="video-authoring">
      <summary><span><strong>Create from a demonstration</strong><small>Upload a task video alone, or pair it with recorder telemetry for the strongest draft.</small></span><b>Video</b></summary>
      <div className="video-authoring__body">
        <div className="video-authoring__intro"><p className="eyebrow">Video to workflow</p><h2>Show the task, then calibrate what matters</h2><p>Telemetry is authoritative when available. Video-only imports remain lower confidence until you connect visual moments to durable page elements.</p></div>
        {!video && <>
          <fieldset className="video-mode"><legend>Demonstration source</legend>
            <label data-selected={mode === "video-with-telemetry"}><input type="radio" name="video-mode" checked={mode === "video-with-telemetry"} onChange={() => void chooseMode("video-with-telemetry")} /><span><strong>Video + recorder telemetry</strong><small>Recommended. Precise browser actions and semantic targets.</small></span></label>
            <label data-selected={mode === "pure-video"}><input type="radio" name="video-mode" checked={mode === "pure-video"} onChange={() => void chooseMode("pure-video")} /><span><strong>Video only</strong><small>Creates visual observations that require manual calibration.</small></span></label>
          </fieldset>
          {mode === "video-with-telemetry" && <label className="editor-field"><span>Finalized recorder session</span><select value={captureSessionId} onChange={(event) => setCaptureSessionId(event.target.value)}><option value="">Choose a synchronized session</option>{sessions.filter((session) => session.status === "finalized" && !session.workflowId).map((session) => <option key={session.id} value={session.id}>{session.actionCount} actions · {new Date(session.startedAt).toLocaleString()}</option>)}</select></label>}
          <label className="video-file"><span>{file ? file.name : "Choose task video"}</span><small>{file ? `${formatBytes(file.size)} · ready to upload` : "MP4, WebM, or MOV · up to 500 MiB · up to 60 minutes"}</small><input accept="video/mp4,video/webm,video/quicktime,.mov" type="file" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setMessage(""); }} /></label>
          <div className="run-launcher__actions"><button className="primary-button" disabled={busy || !file} type="button" onClick={() => void start()}>{busy ? "Processing demonstration…" : "Upload and analyze"}</button>{busy && <button className="secondary-button" type="button" onClick={() => controller.current?.abort()}>Stop waiting</button>}</div>
        </>}
        {video && <VideoProgress video={video} progress={progress} />}
        {video?.timeline && video.timeline.uncertainties.length > 0 && <div className="video-uncertainty"><strong>Needs confirmation</strong><ul>{video.timeline.uncertainties.map((item) => <li key={item.code}>{item.message}</li>)}</ul></div>}
        {video?.status === "needs-calibration" && video.timeline && <VideoCalibrationPanel key={video.id} observations={video.timeline.observations} busy={busy} onCalibrate={calibrate} />}
        {video?.status === "ready" && <div className="video-ready"><div><strong>Calibration is ready</strong><p>The result will enter the same editable WorkflowSpec review and testing flow as recorded and text-created drafts.</p></div><button className="primary-button" disabled={busy} type="button" onClick={() => void compile()}>{busy ? "Creating draft…" : "Create editable draft"}</button></div>}
        {video && !busy && video.status !== "ready" && video.status !== "completed" && <button className="text-button" type="button" onClick={() => { setVideo(null); setMessage(""); }}>Start another video</button>}
        <p className="video-retention">Temporary video media is retained for at most 24 hours. The generated timeline and workflow use semantic steps, not screen coordinates.</p>
        <p className="library-message" role="status">{message}</p>
      </div>
    </details>
  );
}

function VideoProgress({ video, progress }: { video: VideoImport; progress: number }) {
  const stage = video.status === "uploading" ? 1 : video.status === "uploaded" || video.status === "analyzing" ? 2 : video.status === "completed" ? 4 : 3;
  return <section className="video-progress" data-status={video.status} aria-live="polite"><header><div><p className="eyebrow">Import progress</p><h3>{video.fileName}</h3></div><b>{video.status.replace(/-/g, " ")}</b></header><ol>{["Upload", "Analyze", "Calibrate", "Draft"].map((label, index) => <li key={label} data-state={index + 1 < stage ? "done" : index + 1 === stage ? "current" : "next"}><i>{index + 1}</i><span>{label}</span></li>)}</ol>{video.status === "uploading" && <div className="video-meter"><span style={{ width: `${progress}%` }} /><small>{progress}% · {formatBytes(video.uploadedBytes)} of {formatBytes(video.byteSize)}</small></div>}</section>;
}

async function resumeOrCreate(apiBaseUrl: string, key: string, file: File, contentType: VideoImport["contentType"], mode: VideoMode, captureSessionId: string, signal: AbortSignal): Promise<VideoImport> {
  const saved = window.localStorage.getItem(key);
  if (saved) {
    try { const video = await getVideoImport(apiBaseUrl, saved, signal); if (video.fileName === file.name && video.byteSize === file.size && !["failed", "cancelled", "completed"].includes(video.status)) return video; }
    catch { window.localStorage.removeItem(key); }
  }
  return createVideoImport(apiBaseUrl, file, contentType, mode, captureSessionId || undefined);
}

async function mutateVideo(apiBaseUrl: string, id: string, action: "complete" | "analyze" | "calibrate" | "compile", body?: unknown, signal?: AbortSignal): Promise<VideoImport> {
  const response = await fetch(`${apiBaseUrl}/api/v1/video-imports/${id}/${action}`, { method: "POST", credentials: "include", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), Accept: "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal });
  const value: unknown = await response.json();
  if (!response.ok || !isVideoResponse(value)) throw new Error(readApiError(value));
  return value.video;
}

async function pollVideo(apiBaseUrl: string, id: string, onProgress: (video: VideoImport) => void, signal: AbortSignal): Promise<VideoImport> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await wait(1_500, signal);
    const video = await getVideoImport(apiBaseUrl, id, signal); onProgress(video);
    if (!["uploaded", "analyzing"].includes(video.status)) return video;
  }
  throw new Error("Video analysis is still running. Reopen this import later to check its progress.");
}

async function fetchSessions(apiBaseUrl: string): Promise<CaptureSessionSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/capture-sessions`, { credentials: "include", headers: { Accept: "application/json" } }); const body: unknown = await response.json();
  if (!response.ok || !isRecord(body) || !Array.isArray(body.sessions) || !body.sessions.every((item) => validateContract<CaptureSessionSummary>("CaptureSessionSummary", item).ok)) throw new Error("Recorder sessions unavailable.");
  return body.sessions as CaptureSessionSummary[];
}
function videoContentType(file: File): VideoImport["contentType"] | undefined { if (["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) return file.type as VideoImport["contentType"]; return file.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : undefined; }
function resumeKey(file: File, mode: VideoMode, captureSessionId: string): string { return `doonce:video:${file.name}:${file.size}:${file.lastModified}:${mode}:${captureSessionId}`; }
function formatBytes(bytes: number): string { if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KiB`; return `${(bytes / 1024 / 1024).toFixed(1)} MiB`; }
function wait(milliseconds: number, signal: AbortSignal): Promise<void> { return new Promise((resolve, reject) => { const timer = window.setTimeout(resolve, milliseconds); signal.addEventListener("abort", () => { window.clearTimeout(timer); reject(new DOMException("Analysis cancelled", "AbortError")); }, { once: true }); }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
