import { isVideoResponse, readApiError, type VideoImport, type VideoMode } from "./video-authoring-types";

const chunkBytes = 4 * 1024 * 1024;
const maxAttempts = 3;

export async function createVideoImport(apiBaseUrl: string, file: File, contentType: VideoImport["contentType"], mode: VideoMode, captureSessionId?: string): Promise<VideoImport> {
  const response = await fetch(`${apiBaseUrl}/api/v1/video-imports`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ mode, ...(captureSessionId ? { captureSessionId } : {}), fileName: file.name, contentType, byteSize: file.size }),
  });
  const body: unknown = await response.json();
  if (!response.ok || !isVideoResponse(body)) throw new Error(readApiError(body));
  return body.video;
}

export async function uploadVideo(apiBaseUrl: string, file: File, video: VideoImport, onProgress: (video: VideoImport) => void, signal?: AbortSignal): Promise<VideoImport> {
  let current = video;
  while (current.uploadedBytes < file.size) {
    const offset = current.uploadedBytes;
    current = await sendChunk(apiBaseUrl, current.id, file, offset, signal);
    onProgress(current);
  }
  return current;
}

export async function getVideoImport(apiBaseUrl: string, id: string, signal?: AbortSignal): Promise<VideoImport> {
  const response = await fetch(`${apiBaseUrl}/api/v1/video-imports/${id}`, { credentials: "include", headers: { Accept: "application/json" }, signal });
  const body: unknown = await response.json();
  if (!response.ok || !isVideoResponse(body)) throw new Error(readApiError(body));
  return body.video;
}

async function sendChunk(apiBaseUrl: string, id: string, file: File, initialOffset: number, signal?: AbortSignal): Promise<VideoImport> {
  const offset = initialOffset;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const chunk = file.slice(offset, Math.min(offset + chunkBytes, file.size));
      const response = await fetch(`${apiBaseUrl}/api/v1/video-imports/${id}/chunks`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/octet-stream", Accept: "application/json", "Upload-Offset": String(offset) }, body: chunk, signal });
      const body: unknown = await response.json();
      if (response.status === 409 && isRecord(body) && Number.isSafeInteger(body.expectedOffset)) return getVideoImport(apiBaseUrl, id, signal);
      else if (!response.ok || !isVideoResponse(body)) throw new Error(readApiError(body));
      else return body.video;
    } catch (error) {
      if (signal?.aborted || attempt === maxAttempts) throw error;
    }
    await delay(250 * attempt, signal);
  }
  throw new Error("The upload could not resume.");
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => { window.clearTimeout(timer); reject(new DOMException("Upload cancelled", "AbortError")); }, { once: true });
  });
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
