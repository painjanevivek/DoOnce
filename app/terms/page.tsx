import { SiteFooter } from "../features/site/site-footer";
import { SiteHeader } from "../features/site/site-header";

export const metadata = {
  title: "Terms of service draft | DoOnce",
  description: "The pre-launch DoOnce terms of service draft and service boundaries.",
};

export default function TermsPage() {
  return (
    <div className="legal-shell guided-legal">
      <a className="skip-link" href="#terms-main">Skip to terms of service</a>
      <SiteHeader compact />
      <main id="terms-main" className="legal-main">
        <p className="eyebrow">Pre-launch draft · August 2026</p>
        <h1>Terms of Service</h1>
        <p className="legal-lede">This is a public working draft describing DoOnce&apos;s intended service boundary. It is not a final agreement and does not create a contract while DoOnce remains pre-launch.</p>
        <aside className="legal-callout"><strong>Not yet a launch offer</strong><span>Pricing, availability, support commitments, cancellation, liability, governing law, and dispute terms require legal review before publication.</span></aside>

        <section className="legal-section" aria-labelledby="terms-service"><h2 id="terms-service">The intended service</h2><p>DoOnce assists with carefully reviewed browser workflows. It is not an unrestricted browser agent. It is intended to pause when a page changes, a workflow is uncertain, or an action falls outside its approved safety boundary.</p></section>
        <section className="legal-section" aria-labelledby="terms-user"><h2 id="terms-user">What a future user remains responsible for</h2><ul><li>Having permission to access each supported site and use each workflow.</li><li>Reviewing a workflow before activation and reviewing the available preview before a supported run.</li><li>Keeping account credentials secure and following the applicable site&apos;s terms.</li><li>Checking downloaded reports and any business decision made from them.</li></ul></section>
        <section className="legal-section" aria-labelledby="terms-prohibited"><h2 id="terms-prohibited">What DoOnce does not support</h2><p>DoOnce does not support payments, fund transfers, final submissions, account changes, credential entry or storage, one-time passcode handling, CAPTCHA bypass, or autonomous high-impact actions. The future service may pause, disable, or remove a workflow when safety, reliability, or legal risk requires it.</p></section>
        <section className="legal-section" aria-labelledby="terms-access"><h2 id="terms-access">Access and availability</h2><p>DoOnce is not currently deployed as a public service. No availability, support, billing, tax, refund, trial, or cancellation commitments are offered through this draft site. Those terms will be stated only in a counsel-approved version.</p></section>
        <section className="legal-section" aria-labelledby="terms-changes"><h2 id="terms-changes">Changes to this draft</h2><p>Because this is a pre-launch draft, it may change without notice as the company, markets, data practices, and service design are confirmed. A final version will include an effective date, a legal entity, a notice address, and a process for material changes.</p></section>
        <section className="legal-section legal-section--last" aria-labelledby="terms-contact"><h2 id="terms-contact">Questions about this draft</h2><p>The provider and legal contact are not yet established because DoOnce is not deployed. Do not rely on this draft as a final agreement. The approved terms will provide the contact details, applicable law, and notices required for the launch markets.</p></section>
      </main>
      <SiteFooter />
    </div>
  );
}
