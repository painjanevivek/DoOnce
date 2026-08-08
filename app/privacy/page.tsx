import Link from "next/link";
import LegalFooter from "../components/legal-footer";

export const metadata = {
  title: "Privacy policy draft | DoOnce",
  description: "The pre-launch DoOnce privacy policy draft and data practices.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-shell">
      <a className="skip-link" href="#privacy-main">Skip to privacy policy</a>
      <header className="account-header">
        <Link className="brand" href="/" aria-label="DoOnce home">Do<span>Once</span></Link>
        <div className="legal-header-links"><Link href="/terms">Terms</Link><Link className="back-link" href="/">Back to overview</Link></div>
      </header>
      <main id="privacy-main" className="legal-main">
        <p className="eyebrow">Pre-launch draft · August 2026</p>
        <h1>Privacy Policy</h1>
        <p className="legal-lede">This is a public working draft for DoOnce. It explains the product&apos;s intended data boundary, but it is not a final privacy notice, legal advice, or a substitute for counsel-approved terms.</p>
        <aside className="legal-callout"><strong>Before public launch</strong><span>DoOnce will publish an approved version with its legal entity, privacy contact, jurisdictions, hosting providers, retention schedule, and user-rights process.</span></aside>

        <section className="legal-section" aria-labelledby="privacy-scope"><h2 id="privacy-scope">What DoOnce is designed to do</h2><p>DoOnce helps a workspace review and manage low-risk browser workflows. It is intentionally limited to approved report-download work. It stops when a page or action is uncertain and does not provide autonomous high-impact browser actions.</p></section>
        <section className="legal-section" aria-labelledby="privacy-data"><h2 id="privacy-data">Information the product needs</h2><dl className="legal-list"><div><dt>Account and workspace details</dt><dd>Email address, workspace name, user identifier, and role are used to create an account, sign in, and control workspace access.</dd></div><div><dt>Security and session data</dt><dd>Signed session identifiers, token hashes, and limited request metadata help protect accounts, prevent abuse, and investigate incidents.</dd></div><div><dt>Workflow and audit records</dt><dd>Workflow versions and lifecycle history may include identifiers, the actor, timestamps, event types, and aggregate counts so a workspace can review what changed.</dd></div><div><dt>Support information</dt><dd>Support is intended to use only redacted diagnostics that a user deliberately shares.</dd></div></dl></section>
        <section className="legal-section" aria-labelledby="privacy-never"><h2 id="privacy-never">Information DoOnce must not intentionally collect</h2><p>DoOnce is designed not to record passwords, one-time passcodes, payment credentials, browser page contents, raw action values, or final-submission payloads in workflow capture and audit records. Any feature that would change this boundary requires privacy review before it is built.</p></section>
        <section className="legal-section" aria-labelledby="privacy-cookies"><h2 id="privacy-cookies">Cookies and local browser data</h2><p>Authenticated sessions use secure, HttpOnly cookies. These are needed to keep a signed-in workspace session and are not a substitute for a final cookie notice. The published policy will identify every cookie, its purpose, and its duration.</p></section>
        <section className="legal-section" aria-labelledby="privacy-retention"><h2 id="privacy-retention">Retention, sharing, and your choices</h2><p>Final retention periods, subprocessors, storage locations, cross-border transfers, and the process for access, export, correction, or deletion requests have not been approved yet. DoOnce will not present an unreviewed placeholder as a promise. Before launch, the approved notice will provide a privacy contact and a clear rights-request route.</p></section>
        <section className="legal-section" aria-labelledby="privacy-safety"><h2 id="privacy-safety">Safety and incident handling</h2><p>The service is designed to keep tenant data behind tenant-scoped access controls and to pause workflow changes when safety is in doubt. A final incident-response process, notification obligations, and escalation contacts must be approved before launch.</p></section>
        <section className="legal-section legal-section--last" aria-labelledby="privacy-contact"><h2 id="privacy-contact">Questions about this draft</h2><p>The responsible legal entity and privacy contact are not yet established because DoOnce is not deployed. Do not submit sensitive personal information through this draft site. Once those details are approved, they will appear here with an effective date and version history.</p></section>
      </main>
      <LegalFooter />
    </div>
  );
}
