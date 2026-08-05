function isRecording(recordingOrigins, origin) {
  return Array.isArray(recordingOrigins) && recordingOrigins.includes(origin);
}

function setRecording(recordingOrigins, origin, enabled) {
  const origins = new Set(Array.isArray(recordingOrigins) ? recordingOrigins : []);
  if (enabled) origins.add(origin);
  else origins.delete(origin);
  return [...origins];
}

const DoOnceRecordingState = { isRecording, setRecording };

if (typeof module !== "undefined") module.exports = DoOnceRecordingState;
