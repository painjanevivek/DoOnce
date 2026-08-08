import Link from "next/link";
import AccountStatus from "./components/account-status";
import LegalFooter from "./components/legal-footer";
import PolicyServiceStatus from "./components/policy-service-status";

const safetyRules = [
  ["Read-only work", "Allowed only on a workflow's approved domain and path."],
  ["Reversible changes", "Need a visible preview and an explicit approval checkpoint."],
  ["High-impact actions", "Payments, deletion, credentials and final submissions are blocked."],
  ["Anything uncertain", "Pauses for review instead of guessing what to do next."],
];

const releaseSteps = [
  "Create the reviewed local report-download draft.",
  "Run its server policy preview and complete one local test.",
  "Publish only after you confirm the verified receipt for that exact version.",
];

export default function Home() {
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="DoOnce home">Do<span>Once</span></Link>
        <nav aria-label="Primary navigation">
          <a aria-current="page" href="#overview">Overview</a>
          <Link href="/workflows">Workflows</Link>
          <a href="#safety">Safety</a>
          <a href="#release">Release path</a>
        </nav>
        <AccountStatus />
        <span className="status-chip">Controlled pilot</span>
      </header>

      <main id="main-content">
        <section className="hero" id="overview" aria-labelledby="page-title">
          <p className="eyebrow">DoOnce control room</p>
          <h1 id="page-title">Automation you can inspect.</h1>
          <p className="hero-copy">
            DoOnce repeats approved browser work one careful step at a time—and stops whenever the page, action or outcome is uncertain.
          </p>
          <a className="primary-link" href="#safety">Review the safety boundary <span aria-hidden="true">↓</span></a>
        </section>

        <section className="status-grid" aria-label="Current product status">
          <article className="status-card primary-status">
            <p className="card-label">Current workflow</p>
            <h2>Controlled report download</h2>
            <p>Create, review, test, and publish one local report-download workflow with server-confirmed safeguards.</p>
          </article>
          <article className="status-card">
            <p className="card-label">Local capture</p>
            <h2>Consent before recording</h2>
            <p>The extension records only value-free local summaries after site consent and excludes passwords, OTPs, and payment fields.</p>
          </article>
          <article className="status-card">
            <p className="card-label">Workflow runs</p>
            <h2>Test before publish</h2>
            <p>Every draft needs a policy preview and a completed local test receipt before it can be published. Scheduling remains disabled.</p>
          </article>
          <PolicyServiceStatus />
        </section>

        <section className="safety-section" id="safety" aria-labelledby="safety-title">
          <div className="section-heading">
            <p className="eyebrow">Safety boundary</p>
            <h2 id="safety-title">The product’s most important feature is knowing when to stop.</h2>
          </div>
          <dl className="rules-grid">
            {safetyRules.map(([term, description], index) => (
              <div className="rule" key={term}>
                <dt><span aria-hidden="true">0{index + 1}</span>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="release-section" id="release" aria-labelledby="release-title">
          <div>
            <p className="eyebrow">What happens next</p>
            <h2 id="release-title">We earn automation in stages.</h2>
          </div>
          <ol>
            {releaseSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
