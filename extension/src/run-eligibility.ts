export function isConsentableWebOrigin(url: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname));
  } catch {
    return false;
  }
}

export function canRunDemo(url: unknown, consentedOrigins: unknown): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return isConsentableWebOrigin(url)
      && ["localhost", "127.0.0.1"].includes(parsed.hostname)
      && parsed.pathname === "/demo/reports"
      && Array.isArray(consentedOrigins)
      && consentedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
}

export function canStartDemoRun(url: unknown, consentedOrigins: unknown, approved: boolean): boolean {
  return approved && canRunDemo(url, consentedOrigins);
}
