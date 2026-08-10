import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="site-brand" href="/" aria-label="DoOnce home">
          <span aria-hidden="true">D1</span>
          <strong>DoOnce</strong>
        </Link>
        <p>Teach a browser task once. Run the reviewed workflow again.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/install">Install extension</Link>
        <Link href="/sign-up">Account</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <small>Browser workflows remain editable, testable, and explicit.</small>
    </footer>
  );
}
