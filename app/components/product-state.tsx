import type { ReactNode } from "react";

export type StatusTone = "info" | "success" | "warning" | "error";

type StatusNoticeProps = {
  children: ReactNode;
  tone?: StatusTone;
  title?: string;
};

/** A labelled semantic status region. Colour reinforces, never replaces, text. */
export function StatusNotice({ children, title, tone = "info" }: StatusNoticeProps) {
  return (
    <section
      className="status-notice"
      data-tone={tone}
      role={tone === "error" ? "alert" : "status"}
    >
      {title ? <strong className="status-notice__title">{title}</strong> : null}
      <div className="status-notice__content">{children}</div>
    </section>
  );
}

type ProductStateProps = {
  action?: ReactNode;
  description: ReactNode;
  eyebrow?: string;
  title: string;
};

export function EmptyState({ action, description, eyebrow, title }: ProductStateProps) {
  return (
    <section className="product-state product-state--empty">
      {eyebrow ? <p className="product-kicker">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {action ? <div className="product-state__action">{action}</div> : null}
    </section>
  );
}

export function ErrorState({ action, description, eyebrow, title }: ProductStateProps) {
  return (
    <section className="product-state product-state--error" role="alert">
      {eyebrow ? <p className="product-kicker">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <p>{description}</p>
      {action ? <div className="product-state__action">{action}</div> : null}
    </section>
  );
}

type LoadingStateProps = {
  eyebrow?: string;
  label?: string;
  title?: string;
};

export function LoadingState({
  eyebrow,
  label = "Loading content",
  title = "Loading your workspace.",
}: LoadingStateProps) {
  return (
    <section className="product-state product-state--loading" aria-busy="true">
      {eyebrow ? <p className="product-kicker">{eyebrow}</p> : null}
      <h1>{title}</h1>
      <div className="product-skeleton" aria-label={label}>
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}
