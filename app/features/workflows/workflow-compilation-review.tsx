import type { WorkflowCompilation } from "../../../contracts/protocol";
import { WorkflowSpecPreview } from "./workflow-spec-preview";

export function WorkflowCompilationReview({ compilation }: { compilation: WorkflowCompilation }) {
  const review = buildCompilationReview(compilation);
  const { coverage, uncertain } = review;

  return (
    <section className="workflow-compilation" aria-labelledby="compilation-title">
      <header>
        <div>
          <p className="card-label">Compiled draft</p>
          <h3 id="compilation-title">Recording converted into an editable workflow</h3>
        </div>
        <span>Compiler {compilation.compilerVersion}</span>
      </header>

      <dl className="workflow-compilation-facts">
        <div><dt>Recorded actions</dt><dd>{compilation.coverage.length}</dd></div>
        <div><dt>Workflow steps</dt><dd>{compilation.workflow.steps.length}</dd></div>
        <div><dt>Combined deliberately</dt><dd>{coverage.combined ?? 0}</dd></div>
        <div><dt>Needs review</dt><dd>{(coverage.unsupported ?? 0) + uncertain.length}</dd></div>
      </dl>

      {uncertain.length > 0 && (
        <details className="workflow-compilation-warnings" open>
          <summary>{uncertain.length} compiler decision{uncertain.length === 1 ? "" : "s"} to review</summary>
          <ul>{uncertain.map((warning, index) => <li key={`${warning.code}-${index}`}><strong>{warning.code.replace(/^compiler\./, "").replaceAll("-", " ")}</strong><span>{warning.message}</span></li>)}</ul>
        </details>
      )}

      <WorkflowSpecPreview spec={compilation.workflow} />

      <details className="workflow-compilation-evidence">
        <summary>How this draft was produced</summary>
        <p>Every generated field keeps its origin and confidence. Every recorded action is marked as emitted, combined, or unsupported; none are silently removed.</p>
        <dl>
          <div><dt>Source digest</dt><dd><code>{compilation.sourceDigest.slice(0, 16)}…</code></dd></div>
          <div><dt>Observed fields</dt><dd>{compilation.provenance.filter(({ source }) => source === "observed").length}</dd></div>
          <div><dt>Deterministic inferences</dt><dd>{compilation.provenance.filter(({ source }) => source === "deterministically-inferred").length}</dd></div>
          <div><dt>Optional suggestions</dt><dd>{compilation.suggestions.length}</dd></div>
        </dl>
      </details>
    </section>
  );
}

export function buildCompilationReview(compilation: WorkflowCompilation) {
  const coverage = compilation.coverage.reduce((counts, item) => ({ ...counts, [item.outcome]: (counts[item.outcome] ?? 0) + 1 }), {} as Record<string, number>);
  return {
    coverage,
    uncertain: compilation.warnings.filter(({ severity }) => severity === "warning"),
    needsReview: (coverage.unsupported ?? 0) + compilation.warnings.filter(({ severity }) => severity === "warning").length,
  };
}
