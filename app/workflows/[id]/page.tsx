import Link from "next/link";
import AccountStatus from "../../components/account-status";
import WorkflowStudio from "../../features/workflows/workflow-studio";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="workflow-shell">
      <a className="skip-link" href="#workflow-editor">
        Skip to workflow editor
      </a>
      <header className="product-header">
        <Link className="brand" href="/" aria-label="DoOnce home">
          Do<span>Once</span>
        </Link>
        <nav className="workflow-header-actions" aria-label="Workspace navigation">
          <Link href="/workflows">Workflow library</Link>
          <AccountStatus />
        </nav>
      </header>
      <main className="workflow-main" id="workflow-editor">
        <WorkflowStudio workflowId={id} />
      </main>
    </div>
  );
}
