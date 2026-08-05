function canRunDemo(url, consentedOrigins) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname)
      && parsed.pathname === "/demo/reports"
      && Array.isArray(consentedOrigins)
      && consentedOrigins.includes(parsed.origin);
  } catch {
    return false;
  }
}

const DoOnceRunPolicy = { canRunDemo };

if (typeof module !== "undefined") module.exports = DoOnceRunPolicy;
