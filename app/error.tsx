"use client";

import { useEffect } from "react";
import { SystemState } from "./features/site/system-state";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  useEffect(() => {
    console.error("A dashboard route failed to render.", {
      digest: error.digest,
    });
  }, [error.digest]);

  return (
    <main className="state-page state-page--boundary">
      <SystemState
        action={
          <button onClick={reset} type="button">
            Try this view again
          </button>
        }
        eyebrow="Workspace interrupted"
        message="Your workflow was not changed. Retry the view; if the problem continues, share only the service support reference."
        role="alert"
        title="This view could not be loaded."
      />
    </main>
  );
}
