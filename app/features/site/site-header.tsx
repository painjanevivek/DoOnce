import Link from "next/link";
import { ExtensionInstallCta } from "./extension-install-cta";

interface SiteHeaderProps {
  compact?: boolean;
}

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  return (
    <header className="site-header" data-compact={compact || undefined}>
      <Link className="site-brand" href="/" aria-label="DoOnce home">
        <span aria-hidden="true">D1</span>
        <strong>DoOnce</strong>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#examples">Examples</Link>
        <Link href="/workflows">Workflows</Link>
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__signin" href="/sign-up">
          Sign in
        </Link>
        <ExtensionInstallCta />
      </div>
    </header>
  );
}
