function isConsentableWebOrigin(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname));
  } catch {
    return false;
  }
}

function canRunDemo(url, consentedOrigins) {
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

function canStartDemoRun(url, consentedOrigins, approved) {
  return approved === true && canRunDemo(url, consentedOrigins);
}

const DoOnceRunPolicy = { canRunDemo, canStartDemoRun, isConsentableWebOrigin };

if (typeof module !== "undefined") module.exports = DoOnceRunPolicy;
