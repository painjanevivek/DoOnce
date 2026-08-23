import type { ReactNode } from "react";

interface SystemStateProps {
  eyebrow: string;
  title: string;
  message: string;
  action: ReactNode;
  role?: "alert" | "status";
}

export function SystemState({
  eyebrow,
  title,
  message,
  action,
  role,
}: SystemStateProps) {
  return (
    <section
      className="system-state"
      aria-labelledby="system-state-title"
      role={role}
    >
      <p className="site-kicker">{eyebrow}</p>
      <h1 id="system-state-title">{title}</h1>
      <p>{message}</p>
      <div className="system-state__action">{action}</div>
    </section>
  );
}
