import Link from "next/link";
import AccountStatus from "./components/account-status";
import LegalFooter from "./components/legal-footer";
import WorkflowServiceStatus from "./components/workflow-service-status";

const workflowCapabilities = [
  ["Record", "Capture meaningful browser actions as one ordered demonstration."],
  ["Compile", "Turn the demonstration into an editable, reusable workflow draft."],
  ["Run", "Replay published workflow steps in the browser through a deterministic runner."],
  ["Verify", "Check the expected result and keep a readable run history."],
];

const releaseSteps = [
  "Represent the report-download demonstration as a versioned WorkflowSpec.",
  "Compile browser recordings into editable workflow drafts.",
  "Run, verify, and repair the same workflow through interchangeable executors.",
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
          <a href="#workflow">How it works</a>
          <a href="#release">Roadmap</a>
        </nav>
        <AccountStatus />
        <span className="status-chip">Browser workflow alpha</span>
      </header>

      <main id="main-content">
        <section className="hero" id="overview" aria-labelledby="page-title">
          <p className="eyebrow">Demonstration to workflow</p>
          <h1 id="page-title">Teach it once. Run it again.</h1>
          <p className="hero-copy">
            Record a browser task, turn it into an editable workflow, and reuse it whenever the work returns.
          </p>
          <a className="primary-link" href="#workflow">See the workflow path <span aria-hidden="true">↓</span></a>
        </section>

        <section className="status-grid" aria-label="Current product status">
          <article className="status-card primary-status">
            <p className="card-label">Reference workflow</p>
            <h2>Report download</h2>
            <p>The current vertical slice records, reviews, tests, and versions one local report-download workflow.</p>
          </article>
          <article className="status-card">
            <p className="card-label">Browser recording</p>
            <h2>Demonstrate the task</h2>
            <p>The extension captures an ordered local action timeline and can export an approval-first WorkflowSpec draft for review.</p>
          </article>
          <article className="status-card">
            <p className="card-label">Workflow runs</p>
            <h2>Versioned execution</h2>
            <p>Drafts, published versions, test results, and run history remain inspectable while the general runner is built.</p>
          </article>
          <WorkflowServiceStatus />
        </section>

        <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
          <div className="section-heading">
            <p className="eyebrow">One workflow artifact</p>
            <h2 id="workflow-title">Every input becomes the same reusable workflow.</h2>
          </div>
          <dl className="rules-grid">
            {workflowCapabilities.map(([term, description], index) => (
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
            <h2 id="release-title">Build the workflow engine in layers.</h2>
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
