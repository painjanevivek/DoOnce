declare const __DOONCE_API_BASE_URL__: string;

export function normalizeExtensionApiBaseUrl(value: string, release: boolean): string {
  const parsed = new URL(value);
  const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if ((release && parsed.protocol !== "https:") || (!local && parsed.protocol !== "https:")) {
    throw new TypeError("The extension API must use HTTPS outside local development.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new TypeError("The extension API must be a credential-free origin.");
  }
  return parsed.origin;
}

const configuredApiBaseUrl = typeof __DOONCE_API_BASE_URL__ === "string"
  ? __DOONCE_API_BASE_URL__
  : "http://localhost:4000";

export const extensionApiBaseUrl = normalizeExtensionApiBaseUrl(configuredApiBaseUrl, configuredApiBaseUrl.startsWith("https://"));
