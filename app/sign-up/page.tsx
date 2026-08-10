import AccountForm from "../components/account-form";
import { SiteFooter } from "../features/site/site-footer";
import { SiteHeader } from "../features/site/site-header";

export default function SignUpPage() {
  return (
    <div className="account-shell guided-account">
      <a className="skip-link" href="#account-main">
        Skip to account form
      </a>
      <SiteHeader compact />
      <main className="account-main" id="account-main">
        <div className="account-context">
          <p className="site-kicker">DoOnce workspace</p>
          <h1>Every workflow has a clear owner.</h1>
          <p>
            Sign in to review, publish, and run recurring browser workflows
            inside one workspace.
          </p>
          <ul>
            <li>Workspace-scoped access checked by the server</li>
            <li>Signed, expiring sessions stored in HttpOnly cookies</li>
            <li>Recording, review, testing, and publishing in one place</li>
          </ul>
        </div>
        <AccountForm />
      </main>
      <SiteFooter />
    </div>
  );
}
