export type PauseReason = "changed-page" | "slow-network" | "unknown";
export type RunResult = { outcome: "completed" } | { outcome: "paused"; reasonCode: PauseReason; reason?: string };

interface NotificationsApi {
  create(notificationId: string, options: chrome.notifications.NotificationOptions): Promise<string> | Promise<void>;
}

export function describeRunNotification(result: RunResult): { title: string; message: string } {
  if (result.outcome === "completed") {
    return { title: "DoOnce run completed", message: "The local report download was verified." };
  }
  const messages: Record<PauseReason, string> = {
    "changed-page": "The expected page control changed, so the run stopped.",
    "slow-network": "The expected confirmation did not arrive, so the run stopped.",
    unknown: "The run could not be verified, so it stopped.",
  };
  return { title: "DoOnce run paused", message: messages[result.reasonCode] };
}

export function createRunNotification(notifications: NotificationsApi, result: RunResult, iconUrl: string, notificationId: string): Promise<string> | Promise<void> {
  const notification = describeRunNotification(result);
  return notifications.create(notificationId, { type: "basic", iconUrl, title: notification.title, message: notification.message, priority: 0 });
}
