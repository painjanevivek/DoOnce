function isRecording(recordingOrigins, origin) {
  return Array.isArray(recordingOrigins) && recordingOrigins.includes(origin);
}

function setRecording(recordingOrigins, origin, enabled) {
  const origins = new Set(Array.isArray(recordingOrigins) ? recordingOrigins : []);
  if (enabled) origins.add(origin);
  else origins.delete(origin);
  return [...origins];
}

function removeOriginData(records, origin) {
  return Array.isArray(records) ? records.filter((record) => record?.origin !== origin) : [];
}

const DoOnceRecordingState = { isRecording, setRecording, removeOriginData };

if (typeof module !== "undefined") module.exports = DoOnceRecordingState;
