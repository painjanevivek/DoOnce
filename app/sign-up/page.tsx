import Link from "next/link";
import AccountForm from "../components/account-form";

export default function SignUpPage() {
  return (
    <div className="account-shell">
      <a className="skip-link" href="#account-main">Skip to account form</a>
      <header className="account-header">
        <Link className="brand" href="/" aria-label="DoOnce home">Do<span>Once</span></Link>
        <Link className="back-link" href="/">Back to overview</Link>
      </header>
      <main id="account-main" className="account-main">
        <div className="account-context">
          <p className="eyebrow">DoOnce access</p>
          <h1>Every workflow starts with a person in control.</h1>
          <p>Accounts define who can review and own an approved workflow. They do not grant permission to automate payments, deletions, credential entry, or final submission.</p>
          <ul>
            <li>Tenant-specific access, checked by the server</li>
            <li>Signed, expiring sessions stored as HttpOnly cookies</li>
            <li>Recording and scheduling remain deliberately disabled</li>
          </ul>
        </div>
        <AccountForm />
      </main>
    </div>
  );
}
