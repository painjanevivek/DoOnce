function describeRunNotification(result) {
  if (result?.outcome === "completed") {
    return { title: "DoOnce run completed", message: "The local report download was verified." };
  }

  const message = {
    "changed-page": "The expected page control changed, so no action continued.",
    "slow-network": "The expected confirmation did not arrive, so no action continued.",
    unknown: "The run could not be verified, so no action continued.",
  }[result?.reasonCode] ?? "The run paused safely, so no action continued.";
  return { title: "DoOnce run paused safely", message };
}

function createRunNotification(notifications, result, iconUrl, notificationId) {
  const notification = describeRunNotification(result);
  return notifications.create(notificationId, { type: "basic", iconUrl, title: notification.title, message: notification.message, priority: 0 });
}

const DoOnceRunNotification = { createRunNotification, describeRunNotification };

if (typeof module !== "undefined") module.exports = DoOnceRunNotification;
