import Link from "next/link";
import { AuthoringAccordion } from "./authoring-accordion";
import { ExtensionInstallCta } from "./extension-install-cta";
import { GuidedProofMotion } from "./guided-proof-motion";
import { ScenarioCarousel } from "./scenario-carousel";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { taskExamples } from "./site-content";

const narrative = [
  "The demonstration becomes an editable workflow.",
  "The workflow stays inspectable before it runs.",
  "A run succeeds only when its declared outcome is verified.",
];

function ProofBrowser() {
  return (
    <div className="proof-browser" data-proof-media>
      <div className="proof-browser__bar">
        <span />
        <span />
        <span />
        <div>portal.example / invoices</div>
      </div>
      <div className="proof-browser__body">
        <div className="proof-browser__capture">
          <span>Capture 03</span>
          <strong>Download monthly invoice</strong>
          <small>Button name + nearby heading</small>
        </div>
        <div className="proof-browser__cursor" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m5 3 13 9-6 2-3 6Z" fill="currentColor" />
          </svg>
        </div>
        <div className="proof-browser__receipt">
          <span>Outcome</span>
          <strong>Invoice file present</strong>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <GuidedProofMotion>
      <div className="guided-proof-page">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content">
          <section className="guided-hero" aria-labelledby="page-title">
            <div className="guided-hero__copy">
              <p className="site-kicker">Browser work, made repeatable</p>
              <h1 className="hero-title--wide" id="page-title">
                Teach the browser once.
                <span>Keep the workflow.</span>
              </h1>
              <p>
                Show or describe one recurring browser task. DoOnce turns it
                into an editable workflow you can test, publish, and run again.
              </p>
              <div className="guided-hero__actions">
                <ExtensionInstallCta />
                <a href="#how-it-works">See how the proof path works</a>
              </div>
            </div>
            <div className="guided-hero__visual">
              <div className="guided-hero__index" aria-hidden="true">
                01 / Demonstrate
              </div>
              <ProofBrowser />
            </div>
          </section>

          <section
            className="proof-section"
            aria-labelledby="proof-title"
            id="proof"
          >
            <div className="section-intro">
              <p className="site-kicker">From action to evidence</p>
              <h2 id="proof-title">The workflow is the product.</h2>
              <p>
                Recording, text, and video all produce the same reviewable
                artifact. Normal runs follow the published version.
              </p>
            </div>
            <div className="guided-proof-bento">
              <article className="proof-card proof-card--record" data-proof-media>
                <header>
                  <span>Record</span>
                  <small>Ordered browser events</small>
                </header>
                <div className="capture-timeline">
                  <div>
                    <b>01</b>
                    <span>
                      <strong>Open supplier portal</strong>
                      <small>Origin approved</small>
                    </span>
                  </div>
                  <div>
                    <b>02</b>
                    <span>
                      <strong>Choose invoice period</strong>
                      <small>Semantic field captured</small>
                    </span>
                  </div>
                  <div>
                    <b>03</b>
                    <span>
                      <strong>Download invoice</strong>
                      <small>Expected result attached</small>
                    </span>
                  </div>
                </div>
                <footer>
                  <span>Raw secrets excluded</span>
                  <span>3 reviewable actions</span>
                </footer>
              </article>
              <article className="proof-card proof-card--compile" data-proof-media>
                <header>
                  <span>Compile</span>
                  <small>Editable WorkflowSpec</small>
                </header>
                <div className="compile-preview">
                  <code>download_invoice</code>
                  <p>Input: invoice_period</p>
                  <p>Output: invoice_file</p>
                  <span>Draft requires review</span>
                </div>
              </article>
              <article className="proof-card proof-card--verify" data-proof-media>
                <header>
                  <span>Verify</span>
                  <small>Declared outcome</small>
                </header>
                <div className="verification-preview">
                  <div aria-hidden="true" />
                  <p>
                    <strong>Invoice file present</strong>
                    <small>Run completed only after assertion</small>
                  </p>
                </div>
              </article>
            </div>
          </section>

          <div className="task-marquee" aria-label="Example recurring tasks">
            <div className="task-marquee__track">
              {[0, 1].map((copyIndex) => (
                <ul aria-hidden={copyIndex === 1} key={copyIndex}>
                  {taskExamples.map((task) => (
                    <li key={`${copyIndex}-${task}`}>{task}</li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          <section
            className="authoring-section"
            aria-labelledby="authoring-title"
            id="how-it-works"
          >
            <div className="section-intro section-intro--split">
              <div>
                <p className="site-kicker">One artifact, three ways in</p>
                <h2 id="authoring-title">Start with what you already have.</h2>
              </div>
              <p>
                Demonstrate the task live, describe it in plain language, or
                upload a walkthrough. Every path pauses for your review.
              </p>
            </div>
            <AuthoringAccordion />
          </section>

          <section className="narrative-section" aria-label="Workflow principles">
            {narrative.map((sentence) => (
              <p data-reveal-line key={sentence}>
                {sentence.split(" ").map((word, index) => (
                  <span data-reveal-word key={`${word}-${index}`}>
                    {word}{" "}
                  </span>
                ))}
              </p>
            ))}
          </section>

          <section
            className="scenario-section"
            aria-labelledby="scenario-title"
            id="examples"
          >
            <div className="section-intro section-intro--split">
              <div>
                <p className="site-kicker">Concrete starting points</p>
                <h2 id="scenario-title">Picture the task, not the tool.</h2>
              </div>
              <p>
                These are illustrative workflows for recurring operational
                work. They are examples, not customer claims.
              </p>
            </div>
            <ScenarioCarousel />
          </section>

          <section className="guided-action" aria-labelledby="action-title">
            <p className="site-kicker">Your first workflow starts in Chrome</p>
            <h2 id="action-title">Show the task once. Keep the useful part.</h2>
            <p>
              Install the extension, connect a workspace, and record one
              bounded browser routine for review.
            </p>
            <div>
              <ExtensionInstallCta label="Install and record the first task" />
              <Link href="/sign-up">Create a workspace first</Link>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </GuidedProofMotion>
  );
}
