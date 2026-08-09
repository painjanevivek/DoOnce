"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset(): void }) {
  return <html lang="en"><body><main style={{ maxWidth: 720, margin: "0 auto", padding: "10vh 1rem", fontFamily: "system-ui, sans-serif" }}><h1>DoOnce could not open this page.</h1><p>No workflow change was made. Retry once, then contact support if the problem continues.</p><button type="button" onClick={reset} style={{ minHeight: 44, padding: ".6rem 1rem" }}>Try again</button></main></body></html>;
}
