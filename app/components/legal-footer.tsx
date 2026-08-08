import Link from "next/link";

export default function LegalFooter() {
  return (
    <footer className="legal-footer">
      <span>DoOnce is pre-launch. These are draft notices, not final legal terms.</span>
      <div>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </footer>
  );
}
