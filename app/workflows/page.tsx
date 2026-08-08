import Link from "next/link";
import AccountStatus from "../components/account-status";
import LegalFooter from "../components/legal-footer";
import WorkflowCatalog from "../components/workflow-catalog";

export default function WorkflowsPage() {
  return (
    <div className="workflow-shell">
      <a className="skip-link" href="#workflow-main">Skip to workflows</a>
      <header className="account-header"><Link className="brand" href="/" aria-label="DoOnce home">Do<span>Once</span></Link><div className="workflow-header-actions"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link className="back-link" href="/">Back to control room</Link><AccountStatus /></div></header>
      <main id="workflow-main" className="workflow-main"><WorkflowCatalog /></main>
      <LegalFooter />
    </div>
  );
}
