import type { Workflow } from "./contracts";

export function WorkflowSummaryList({ workflows }: { workflows: Workflow[] }) {
  if (workflows.length === 0) return <p className="workflow-empty">No workflows yet. The report-download template is ready when you are.</p>;
  return (
    <ul className="workflow-list">
      {workflows.map((workflow) => (
        <li key={workflow.id}>
          <span><strong>{workflow.title}</strong><small>{workflow.activeVersion ? `Active version ${workflow.activeVersion}` : "Not active"}</small></span>
          <b>{workflow.activeVersion ? "Active" : "Not active"}</b>
        </li>
      ))}
    </ul>
  );
}
