"use client";

import type { ReactNode } from "react";

export type StudioView =
  | "overview"
  | "steps"
  | "inputs"
  | "test"
  | "history"
  | "json";

interface WorkflowWorkspaceProps {
  activeView: StudioView;
  panels: Record<StudioView, ReactNode>;
  inspector: ReactNode;
  issueViews: ReadonlySet<StudioView>;
  onViewChange(view: StudioView): void;
}

const workspaceGroups: ReadonlyArray<{
  label: string;
  views: ReadonlyArray<{ id: StudioView; label: string; note: string }>;
}> = [
  {
    label: "Build",
    views: [
      { id: "overview", label: "Overview", note: "Purpose and domains" },
      { id: "steps", label: "Steps", note: "Actions and targets" },
      { id: "inputs", label: "Inputs", note: "Values provided at run time" },
    ],
  },
  {
    label: "Verify",
    views: [{ id: "test", label: "Test", note: "Run this saved draft" }],
  },
  {
    label: "Inspect",
    views: [
      { id: "history", label: "History", note: "Published versions" },
      { id: "json", label: "Developer JSON", note: "Canonical diagnostics" },
    ],
  },
];

const allViews = workspaceGroups.flatMap((group) => group.views);

export function WorkflowWorkspace({
  activeView,
  panels,
  inspector,
  issueViews,
  onViewChange,
}: WorkflowWorkspaceProps) {
  return (
    <div className="workflow-workspace">
      <nav
        className="workspace-outline"
        aria-label="Workflow outline"
        data-workspace-region="outline"
      >
        {workspaceGroups.map((group) => (
          <section key={group.label}>
            <h2>{group.label}</h2>
            {group.views.map((view) => (
              <button
                aria-current={activeView === view.id ? "page" : undefined}
                key={view.id}
                onClick={() => onViewChange(view.id)}
                type="button"
              >
                <strong>
                  {view.label}
                  {issueViews.has(view.id) ? (
                    <span className="workspace-issue" aria-label="Has errors" />
                  ) : null}
                </strong>
                <small>{view.note}</small>
              </button>
            ))}
          </section>
        ))}
      </nav>

      <main className="workspace-canvas" data-workspace-region="canvas">
        <div className="workspace-mobile-switcher">
          <label htmlFor="workspace-view">Editor region</label>
          <select
            id="workspace-view"
            onChange={(event) => onViewChange(event.target.value as StudioView)}
            value={activeView}
          >
            {allViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.label}
              </option>
            ))}
          </select>
        </div>
        {allViews.map((view) => (
          <section
            aria-label={`${view.label} editor`}
            data-view={view.id}
            hidden={view.id !== activeView}
            key={view.id}
          >
            {panels[view.id]}
          </section>
        ))}
      </main>

      <aside className="workspace-inspector" data-workspace-region="inspector">
        {inspector}
      </aside>
    </div>
  );
}
