export default function NotFound() {
  return (
    <main className="error-page">
      <p className="eyebrow">Page not found</p>
      <h1>There is nothing to run here.</h1>
      <p>Return to the DoOnce overview to inspect the current product boundary.</p>
      <Link className="primary-link" href="/">Return to overview <span aria-hidden="true">→</span></Link>
    </main>
  );
}
import Link from "next/link";
