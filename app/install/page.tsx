import type { Metadata } from "next";
import { InstallPanel } from "../features/site/install-panel";
import { resolveInstallDestination } from "../features/site/install-destination";
import { SiteFooter } from "../features/site/site-footer";
import { SiteHeader } from "../features/site/site-header";

export const metadata: Metadata = {
  title: "Install DoOnce for Chrome",
  description:
    "Open the verified DoOnce Chrome Web Store destination or join the workspace access list.",
};

export default function InstallPage() {
  const destination = resolveInstallDestination();

  return (
    <div className="site-shell site-shell--install">
      <SiteHeader compact />
      <main className="install-main">
        <div className="install-intro">
          <p className="site-kicker">Chrome extension</p>
          <h2>Start where the work already happens.</h2>
          <p>
            DoOnce captures a bounded demonstration, turns it into an editable
            workflow draft, and keeps normal runs deterministic.
          </p>
          <ol>
            <li>Review Chrome&apos;s requested permissions.</li>
            <li>Connect the extension to your DoOnce workspace.</li>
            <li>Record one careful browser task.</li>
          </ol>
        </div>
        <InstallPanel destination={destination} />
      </main>
      <SiteFooter />
    </div>
  );
}
