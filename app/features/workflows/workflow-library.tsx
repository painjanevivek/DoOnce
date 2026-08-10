"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { WorkflowSummary } from "./authoring-types";
import { BetaEvidencePanel } from "./beta-evidence-panel";
import { CapturePairingPanel } from "./capture-pairing-panel";
import { CaptureSessionInbox } from "./capture-session-inbox";
import { RunHistoryPanel } from "./run-history-panel";
import { TextAuthoringPanel } from "./text-authoring-panel";
import { VideoAuthoringPanel } from "./video-authoring-panel";
import {
  WorkflowLibraryView,
  type AuthoringMode,
  type WorkflowLibraryState,
} from "./workflow-library-view";
import { WorkflowRunPanel } from "./workflow-run-panel";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

export default function WorkflowLibrary() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [state, setState] = useState<WorkflowLibraryState>("loading");
  const [message, setMessage] = useState("");
  const [activeMode, setActiveMode] = useState<AuthoringMode>("record");
  const [selectedRun, setSelectedRun] = useState<WorkflowSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/workflow-specs`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const body: unknown = await response.json();

      if (response.status === 401) return setState("signed-out");
      if (!response.ok || !isWorkflowList(body)) {
        throw new Error("Workflow list unavailable.");
      }

      setWorkflows(body.workflows);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function openEditor(workflow: WorkflowSummary) {
    if (workflow.draftVersion) {
      router.push(`/workflows/${workflow.id}`);
      return;
    }

    setMessage("Creating a new draft version…");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/workflow-specs/${workflow.id}/next-draft`,
        {
          method: "POST",
          credentials: "include",
          headers: { Accept: "application/json" },
        },
      );
      const body: unknown = await response.json();

      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("workflow" in body)
      ) {
        throw new Error(readError(body));
      }

      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "A new draft could not be created.",
      );
    }
  }

  return (
    <WorkflowLibraryView
      activeMode={activeMode}
      authoringPanels={{
        record: (
          <>
            <CapturePairingPanel />
            <CaptureSessionInbox />
          </>
        ),
        describe: (
          <TextAuthoringPanel apiBaseUrl={apiBaseUrl} onDraftCreated={load} />
        ),
        video: (
          <VideoAuthoringPanel apiBaseUrl={apiBaseUrl} onDraftCreated={load} />
        ),
      }}
      message={message}
      onModeChange={setActiveMode}
      onOpenWorkflow={(workflow) => void openEditor(workflow)}
      onRefresh={() => void load()}
      onRun={setSelectedRun}
      operations={
        <>
          <RunHistoryPanel apiBaseUrl={apiBaseUrl} />
          <BetaEvidencePanel apiBaseUrl={apiBaseUrl} workflows={workflows} />
        </>
      }
      runDialog={
        selectedRun ? (
          <WorkflowRunPanel
            apiBaseUrl={apiBaseUrl}
            onClose={() => setSelectedRun(null)}
            workflow={selectedRun}
          />
        ) : null
      }
      state={state}
      workflows={workflows}
    />
  );
}

function isWorkflowList(
  value: unknown,
): value is { workflows: WorkflowSummary[] } {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { workflows?: unknown }).workflows)
  ) {
    return false;
  }

  return (value as { workflows: unknown[] }).workflows.every((item) => {
    if (!item || typeof item !== "object") return false;
    const workflow = item as Partial<WorkflowSummary>;

    return (
      typeof workflow.id === "string" &&
      typeof workflow.title === "string" &&
      (workflow.activeVersion === null ||
        typeof workflow.activeVersion === "number") &&
      (workflow.draftVersion === null ||
        typeof workflow.draftVersion === "number") &&
      (workflow.status === "draft" ||
        workflow.status === "active" ||
        workflow.status === "archived") &&
      typeof workflow.updatedAt === "string" &&
      (workflow.lastRunAt === null || typeof workflow.lastRunAt === "string") &&
      (workflow.successRate === null ||
        typeof workflow.successRate === "number")
    );
  });
}

function readError(value: unknown): string {
  return value &&
    typeof value === "object" &&
    typeof (value as { error?: unknown }).error === "string"
    ? (value as { error: string }).error
    : "A new draft could not be created.";
}
