import Link from "next/link";
import WorkflowCatalog from "../components/workflow-catalog";

export default function WorkflowsPage() {
  return (
    <div className="workflow-shell">
      <a className="skip-link" href="#workflow-main">Skip to workflows</a>
      <header className="account-header"><Link className="brand" href="/" aria-label="DoOnce home">Do<span>Once</span></Link><Link className="back-link" href="/">Back to control room</Link></header>
      <main id="workflow-main" className="workflow-main"><WorkflowCatalog /></main>
    </div>
  );
}
