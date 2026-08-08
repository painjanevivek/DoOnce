"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "sign-up" | "sign-in";
type FormState = "idle" | "submitting" | "success" | "error";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000";

function errorMessageFor(status: number): string {
  if (status === 400) return "Check the required fields and try again.";
  if (status === 401) return "Email or password is incorrect.";
  if (status === 409) return "Unable to create this account. Try signing in instead.";
  if (status === 403) return "This browser origin is not approved for authentication.";
  if (status === 429) return "Too many attempts. Wait one minute before trying again.";
  if (status === 503) return "Authentication is not configured on the service yet.";
  return "We could not complete that request. Please try again.";
}

export default function AccountForm() {
  const [mode, setMode] = useState<Mode>("sign-up");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = mode === "sign-up"
      ? { email: data.get("email"), password: data.get("password"), tenantName: data.get("tenantName") }
      : { email: data.get("email"), password: data.get("password") };

    setState("submitting");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setState("error");
        setMessage(errorMessageFor(response.status));
        return;
      }
      setState("success");
      setMessage(mode === "sign-up" ? "Workspace created. Your secure session is ready." : "Welcome back. Your secure session is ready.");
    } catch {
      setState("error");
      setMessage("The service could not be reached. No account changes were confirmed.");
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setState("idle");
    setMessage("");
  }

  return (
    <section className="account-card" aria-labelledby="account-form-title">
      <div className="account-switch" aria-label="Account action">
        <button aria-pressed={mode === "sign-up"} className={mode === "sign-up" ? "is-active" : ""} onClick={() => changeMode("sign-up")} type="button">Create workspace</button>
        <button aria-pressed={mode === "sign-in"} className={mode === "sign-in" ? "is-active" : ""} onClick={() => changeMode("sign-in")} type="button">Sign in</button>
      </div>
      <div className="account-card-intro">
        <p className="eyebrow">Secure account access</p>
        <h2 id="account-form-title">{mode === "sign-up" ? "Create your workspace." : "Continue to your workspace."}</h2>
        <p>{mode === "sign-up" ? "Create the first owner account. Workflow publication requires server capability checks and a verified local test." : "Use the account that owns your DoOnce workspace."}</p>
      </div>

      <form className="account-form" onSubmit={submit}>
        {mode === "sign-up" && (
          <p className="field">
            <label htmlFor="tenantName">Workspace name</label>
            <input autoComplete="organization" id="tenantName" maxLength={120} minLength={1} name="tenantName" placeholder="Example: Acme reporting" required type="text" />
          </p>
        )}
        <p className="field">
          <label htmlFor="email">Work email</label>
          <input autoComplete="email" id="email" maxLength={320} name="email" placeholder="name@company.com" required type="email" />
        </p>
        <p className="field">
          <label htmlFor="password">Password</label>
          <input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} id="password" maxLength={128} minLength={mode === "sign-up" ? 12 : 1} name="password" required type="password" />
          {mode === "sign-up" && <span className="field-hint">Use at least 12 characters. DoOnce never records passwords in workflows.</span>}
        </p>
        <p className="account-feedback" aria-live="polite" data-state={state}>{message}</p>
        {state === "success" ? (
          <Link className="account-submit" href="/workflows">Open workflow workspace</Link>
        ) : (
          <button className="account-submit" disabled={state === "submitting"} type="submit">
            {state === "submitting" ? "Securing your session…" : mode === "sign-up" ? "Create secure workspace" : "Sign in securely"}
          </button>
        )}
      </form>
      <p className="account-note">Your browser receives an HttpOnly session cookie. DoOnce does not place authentication tokens in local storage.</p>
    </section>
  );
}
