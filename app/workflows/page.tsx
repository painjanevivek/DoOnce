import Link from "next/link";
import AccountStatus from "../components/account-status";
import LegalFooter from "../components/legal-footer";
import WorkflowLibrary from "../features/workflows/workflow-library";

export default function WorkflowsPage() {
  return (
    <div className="workflow-shell">
      <a className="skip-link" href="#workflow-main">
        Skip to workflows
      </a>
      <header className="product-header">
        <Link className="brand" href="/" aria-label="DoOnce home">
          Do<span>Once</span>
        </Link>
        <nav className="workflow-header-actions" aria-label="Workspace navigation">
          <Link href="/">Product</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <AccountStatus />
        </nav>
      </header>
      <main id="workflow-main" className="workflow-main">
        <WorkflowLibrary />
      </main>
      <LegalFooter />
    </div>
  );
}
