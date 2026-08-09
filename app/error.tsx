"use client";

import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => { console.error("A dashboard route failed to render.", { digest: error.digest }); }, [error.digest]);
  return <main className="workflow-main" style={{ margin: "0 auto" }}><section className="library-state" role="alert"><p className="eyebrow">Workspace interrupted</p><h1>This view could not be loaded.</h1><p>Your workflow was not changed. Retry the view; if the problem continues, share the support reference shown by the service rather than page content.</p><button className="primary-button" type="button" onClick={reset}>Try again</button></section></main>;
}
