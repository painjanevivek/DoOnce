"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AccountState = "checking" | "signed-in" | "signed-out" | "unavailable";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function isCurrentUser(value: unknown): value is { user: { email: string; role: string } } {
  if (typeof value !== "object" || value === null) return false;
  const user = (value as Record<string, unknown>).user;
  if (typeof user !== "object" || user === null) return false;
  const record = user as Record<string, unknown>;
  return typeof record.email === "string" && record.email.length <= 320 && typeof record.role === "string" && record.role.length <= 32;
}

export default function AccountStatus() {
  const [state, setState] = useState<AccountState>("checking");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadAccount() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (response.status === 401) return setState("signed-out");
        const body: unknown = await response.json();
        if (!response.ok || !isCurrentUser(body)) return setState("unavailable");
        setEmail(body.user.email);
        setState("signed-in");
      } catch {
        if (!controller.signal.aborted) setState("unavailable");
      }
    }
    void loadAccount();
    return () => controller.abort();
  }, []);

  async function signOut() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/sign-out`, { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Sign out was not confirmed.");
      setEmail("");
      setState("signed-out");
    } catch {
      setState("unavailable");
    }
  }

  if (state === "signed-in") {
    return <div className="account-status" aria-live="polite"><span title={email}>Signed in</span><button onClick={() => void signOut()} type="button">Sign out</button></div>;
  }
  if (state === "signed-out") return <Link className="header-action" href="/sign-up">Create workspace</Link>;
  if (state === "unavailable") return <span className="account-status account-status--unavailable">Account service offline</span>;
  return <span className="account-status">Checking account</span>;
}
