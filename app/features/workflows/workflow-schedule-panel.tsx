"use client";

import { useCallback, useState } from "react";

interface Profile { id: string; name: string; enabled: boolean }
interface Schedule { id: string; cronExpression: string; timezone: string; enabled: boolean; nextRunAt: string; sessionProfileId: string }

export function WorkflowSchedulePanel({ apiBaseUrl, workflowId, inputs }: { apiBaseUrl: string; workflowId: string; inputs: Record<string, string> }) {
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [cronExpression, setCronExpression] = useState("0 9 * * 1-5");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [profileId, setProfileId] = useState("");
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [newProfile, setNewProfile] = useState({ name: "", secretReference: "" });

  const load = useCallback(async () => {
    if (loaded) return;
    setBusy(true);
    try {
      const [profileResponse, scheduleResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/browser-session-profiles`, { credentials: "include" }),
        fetch(`${apiBaseUrl}/api/v1/schedules?workflowId=${encodeURIComponent(workflowId)}`, { credentials: "include" }),
      ]);
      const profileBody: unknown = await profileResponse.json();
      const scheduleBody: unknown = await scheduleResponse.json();
      if (!profileResponse.ok || !isProfiles(profileBody) || !scheduleResponse.ok || !isSchedules(scheduleBody)) throw new Error("Background run settings are unavailable.");
      setProfiles(profileBody.profiles);
      setSchedules(scheduleBody.schedules);
      setProfileId(profileBody.profiles.find((profile) => profile.enabled)?.id ?? "");
      setLoaded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Background run settings are unavailable.");
    } finally {
      setBusy(false);
    }
  }, [apiBaseUrl, loaded, workflowId]);

  async function request(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(`${apiBaseUrl}${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers } });
    const body: unknown = response.status === 204 ? {} : await response.json();
    if (!response.ok) throw new Error(readError(body));
    return body;
  }

  async function preview() {
    await perform(async () => {
      const body = await request("/api/v1/schedules/preview", { method: "POST", body: JSON.stringify({ cronExpression, timezone }) });
      if (!isPreview(body)) throw new Error("The schedule preview is invalid.");
      setNextRuns(body.nextRuns);
    });
  }

  async function createSchedule() {
    await perform(async () => {
      const body = await request("/api/v1/schedules", { method: "POST", body: JSON.stringify({ workflowId, cronExpression, timezone, dstPolicy: "skip-duplicate", inputBindings: inputs, sessionProfileId: profileId }) });
      if (!isSchedule(body)) throw new Error("The saved schedule is invalid.");
      setSchedules((current) => [body.schedule, ...current]);
      setMessage("Schedule saved. Its managed browser can run while this dashboard is closed.");
    }, false);
  }

  async function toggle(schedule: Schedule) {
    await perform(async () => {
      const body = await request(`/api/v1/schedules/${schedule.id}/enabled`, { method: "POST", body: JSON.stringify({ enabled: !schedule.enabled }) });
      if (!isSchedule(body)) throw new Error("The updated schedule is invalid.");
      setSchedules((current) => current.map((item) => item.id === body.schedule.id ? body.schedule : item));
    });
  }

  async function remove(id: string) {
    await perform(async () => {
      await request(`/api/v1/schedules/${id}`, { method: "DELETE" });
      setSchedules((current) => current.filter((schedule) => schedule.id !== id));
    });
  }

  async function addProfile() {
    await perform(async () => {
      const body = await request("/api/v1/browser-session-profiles", { method: "POST", body: JSON.stringify(newProfile) });
      if (!isProfile(body)) throw new Error("The browser session response is invalid.");
      setProfiles((current) => [...current, body.profile]);
      setProfileId(body.profile.id);
      setNewProfile({ name: "", secretReference: "" });
      setMessage("Session reference added. Secret material stays in your configured provider.");
    }, false);
  }

  async function perform(work: () => Promise<void>, clear = true) {
    setBusy(true);
    if (clear) setMessage("");
    try { await work(); } catch (error) { setMessage(error instanceof Error ? error.message : "The request failed."); } finally { setBusy(false); }
  }

  return (
    <details className="schedule-panel" onToggle={(event) => { if (event.currentTarget.open) void load(); }}>
      <summary><span><strong>Run in the background</strong><small>Schedules use an isolated managed browser.</small></span><b>{schedules.filter((schedule) => schedule.enabled).length || "Set up"}</b></summary>
      <div className="schedule-panel__body">
        <div className="runtime-choice"><span aria-hidden="true">Cloud</span><div><strong>Managed browser required</strong><p>Local extension runs need Chrome open. Background runs continue with a separate session reference.</p></div></div>
        {busy && !loaded && <p aria-busy="true">Loading background settings...</p>}
        {loaded && <>
          <div className="schedule-form">
            <label><span>When</span><input aria-label="Cron expression" value={cronExpression} onChange={(event) => setCronExpression(event.target.value)} /><small>0 9 * * 1-5 means weekdays at 9:00.</small></label>
            <label><span>Timezone</span><input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
            <label><span>Managed session</span><select value={profileId} onChange={(event) => setProfileId(event.target.value)}><option value="">Choose a session</option>{profiles.filter((profile) => profile.enabled).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
          </div>
          <div className="schedule-actions"><button className="secondary-button" disabled={busy} onClick={() => void preview()} type="button">Preview next five</button><button className="primary-button" disabled={busy || !profileId} onClick={() => void createSchedule()} type="button">Save schedule</button></div>
          {nextRuns.length > 0 && <ol className="schedule-preview">{nextRuns.map((value) => <li key={value}>{new Date(value).toLocaleString(undefined, { timeZone: timezone, dateStyle: "medium", timeStyle: "short" })}<small>{timezone}</small></li>)}</ol>}
          <details className="schedule-session-setup"><summary>Add a managed browser session</summary><p>Owners provide a secret-manager reference to Playwright storage state. Never paste cookies or passwords here.</p><div className="schedule-form schedule-form--profile"><label><span>Name</span><input value={newProfile.name} onChange={(event) => setNewProfile((current) => ({ ...current, name: event.target.value }))} placeholder="Finance reporting" /></label><label><span>Secret reference</span><input value={newProfile.secretReference} onChange={(event) => setNewProfile((current) => ({ ...current, secretReference: event.target.value }))} placeholder="env://FINANCE_SESSION" /></label></div><button className="secondary-button" disabled={busy || !newProfile.name || !newProfile.secretReference} onClick={() => void addProfile()} type="button">Add session reference</button></details>
          {schedules.length > 0 && <ul className="schedule-list">{schedules.map((schedule) => <li key={schedule.id}><span><strong>{schedule.cronExpression}</strong><small>{schedule.timezone} - next {new Date(schedule.nextRunAt).toLocaleString()}</small></span><b data-enabled={schedule.enabled}>{schedule.enabled ? "Active" : "Paused"}</b><div><button disabled={busy} onClick={() => void toggle(schedule)} type="button">{schedule.enabled ? "Pause" : "Resume"}</button><button disabled={busy} onClick={() => void remove(schedule.id)} type="button">Delete</button></div></li>)}</ul>}
        </>}
        <p className="schedule-message" role="status">{message}</p>
      </div>
    </details>
  );
}

function object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function profile(value: unknown): value is Profile { return object(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.enabled === "boolean"; }
function schedule(value: unknown): value is Schedule { return object(value) && typeof value.id === "string" && typeof value.cronExpression === "string" && typeof value.timezone === "string" && typeof value.enabled === "boolean" && typeof value.nextRunAt === "string" && typeof value.sessionProfileId === "string"; }
function isProfiles(value: unknown): value is { profiles: Profile[] } { return object(value) && Array.isArray(value.profiles) && value.profiles.every(profile); }
function isSchedules(value: unknown): value is { schedules: Schedule[] } { return object(value) && Array.isArray(value.schedules) && value.schedules.every(schedule); }
function isProfile(value: unknown): value is { profile: Profile } { return object(value) && profile(value.profile); }
function isSchedule(value: unknown): value is { schedule: Schedule } { return object(value) && schedule(value.schedule); }
function isPreview(value: unknown): value is { nextRuns: string[] } { return object(value) && Array.isArray(value.nextRuns) && value.nextRuns.length <= 5 && value.nextRuns.every((item) => typeof item === "string"); }
function readError(value: unknown): string { return object(value) && typeof value.error === "string" ? value.error : "The request failed."; }
