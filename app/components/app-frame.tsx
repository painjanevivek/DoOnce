import Link from "next/link";
import type { ReactNode } from "react";
import AccountStatus from "./account-status";
import LegalFooter from "./legal-footer";

export type AppFrameLink = {
  href: string;
  label: string;
};

type AppFrameProps = {
  children: ReactNode;
  mainId: string;
  links: AppFrameLink[];
  skipLabel: string;
  footer?: boolean;
};

/**
 * Shared signed-in shell. Page-specific workflow controls deliberately stay
 * outside this component so the frame cannot imply permission to run or edit.
 */
export function AppFrame({
  children,
  footer = false,
  links,
  mainId,
  skipLabel,
}: AppFrameProps) {
  return (
    <div className="workflow-shell app-frame">
      <a className="skip-link" href={`#${mainId}`}>
        {skipLabel}
      </a>
      <header className="product-header app-frame__header">
        <Link className="brand" href="/" aria-label="DoOnce home">
          Do<span>Once</span>
        </Link>
        <nav className="workflow-header-actions" aria-label="Workspace navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <AccountStatus />
        </nav>
      </header>
      <main className="workflow-main app-frame__main" id={mainId}>
        {children}
      </main>
      {footer ? <LegalFooter /> : null}
    </div>
  );
}
