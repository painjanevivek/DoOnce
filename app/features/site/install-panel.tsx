import Link from "next/link";
import type { InstallDestination } from "./install-destination";

interface InstallPanelProps {
  destination: InstallDestination;
}

export function InstallPanel({ destination }: InstallPanelProps) {
  const available = destination.kind === "external";

  return (
    <section
      className="install-panel"
      data-availability={available ? "available" : "unavailable"}
      aria-labelledby="install-panel-title"
    >
      <div className="install-panel__status" aria-hidden="true">
        <span />
        {available ? "Distribution ready" : "Distribution pending"}
      </div>
      <h1 id="install-panel-title">
        {available
          ? "Add DoOnce to Chrome."
          : "Extension distribution is not configured."}
      </h1>
      <p>
        {available
          ? "The Chrome Web Store opens in a new tab. Chrome will show the permissions for your review before anything is installed."
          : "The public store destination has not been connected yet. Create a workspace to receive access details when distribution is ready."}
      </p>
      {available ? (
        <a
          className="install-panel__action"
          href={destination.href}
          rel="noreferrer noopener"
          target="_blank"
        >
          Continue to the Chrome Web Store
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" />
          </svg>
        </a>
      ) : (
        <Link className="install-panel__action" href={destination.href}>
          Create a workspace
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M3 8h9M9 4l4 4-4 4" fill="none" stroke="currentColor" />
          </svg>
        </Link>
      )}
      <p className="install-panel__note">
        DoOnce does not claim installation until Chrome confirms it.
      </p>
    </section>
  );
}
