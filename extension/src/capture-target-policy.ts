export interface CaptureTargetMetadata {
  isContentEditable: boolean;
  tagName: string;
  inputType?: string;
  autocomplete?: string;
  name?: string;
  id?: string;
}

export function isProtectedCaptureTarget(target: CaptureTargetMetadata): boolean {
  if (target.isContentEditable) return true;
  const identity = `${target.inputType ?? ""} ${target.autocomplete ?? ""} ${target.name ?? ""} ${target.id ?? ""}`;
  return target.tagName.toLowerCase() === "input" && /password|one-time-code|otp|cc-|card|cvc|cvv|security.?code|secret|token|pin/i.test(identity);
}
