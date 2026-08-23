export type InstallDestination =
  | { kind: "external"; href: string }
  | { kind: "unavailable"; href: "/sign-up" };

const unavailableDestination: InstallDestination = Object.freeze({
  kind: "unavailable",
  href: "/sign-up",
});

export function resolveInstallDestination(
  value = process.env.NEXT_PUBLIC_EXTENSION_INSTALL_URL,
): InstallDestination {
  try {
    const url = new URL(value ?? "");
    const isOfficialDetailPage =
      url.protocol === "https:" &&
      url.hostname === "chromewebstore.google.com" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      /^\/detail\/[^/]+\/[^/]+\/?$/.test(url.pathname);

    return isOfficialDetailPage
      ? { kind: "external", href: url.href }
      : unavailableDestination;
  } catch {
    return unavailableDestination;
  }
}
