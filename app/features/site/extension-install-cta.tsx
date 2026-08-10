import Link from "next/link";

interface ExtensionInstallCtaProps {
  className?: string;
  label?: string;
}

export function ExtensionInstallCta({
  className = "site-install-cta",
  label = "Install the Chrome extension",
}: ExtensionInstallCtaProps = {}) {
  return (
    <Link className={className} href="/install">
      <span>{label}</span>
      <svg aria-hidden="true" viewBox="0 0 16 16">
        <path d="M3 8h9M9 4l4 4-4 4" fill="none" stroke="currentColor" />
      </svg>
    </Link>
  );
}
