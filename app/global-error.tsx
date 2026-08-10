"use client";

import { SystemState } from "./features/site/system-state";

export default function GlobalError({ reset }: { error: Error; reset(): void }) {
  return (
    <html lang="en">
      <body className="global-error-body">
        <main className="state-page state-page--boundary">
          <SystemState
            action={
              <button onClick={reset} type="button">
                Try DoOnce again
              </button>
            }
            eyebrow="Application interrupted"
            message="No workflow change was confirmed. Retry once, then contact support if the problem continues."
            role="alert"
            title="DoOnce could not open this page."
          />
        </main>
      </body>
    </html>
  );
}
