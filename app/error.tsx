"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <p className="eyebrow">Dashboard unavailable</p>
      <h1>We could not load this page.</h1>
      <p>Nothing ran and no workflow state was changed. You can try loading the dashboard again.</p>
      <button type="button" onClick={reset}>Try again</button>
    </main>
  );
}
