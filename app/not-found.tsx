import Link from "next/link";
import { SiteFooter } from "./features/site/site-footer";
import { SiteHeader } from "./features/site/site-header";
import { SystemState } from "./features/site/system-state";

export default function NotFound() {
  return (
    <div className="state-page">
      <SiteHeader compact />
      <main>
        <SystemState
          action={<Link href="/">Return to the homepage</Link>}
          eyebrow="Page not found"
          message="No workflow was changed. Return to the homepage or open your workflow library."
          title="There is nothing to run here."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
