/**
 * GRIT — Video Render Service
 * Sends workout data to the Remotion render server.
 * Polls for completion. Downloads the result.
 */

import * as Sharing from "expo-sharing";
import type { MontageInput } from "./montageBuilder";

// Server URL — localhost for dev, change for production
const SERVER_URL = "http://192.168.0.35:3001";

interface RenderJobStatus {
  id: string;
  status: "queued" | "rendering" | "done" | "error";
  progress: number;
  videoUrl?: string;
  error?: string;
}

/**
 * Submit a render job to the server.
 */
export async function submitRenderJob(input: MontageInput): Promise<string> {
  const response = await fetch(`${SERVER_URL}/api/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Render server error: ${response.status}`);
  }

  const data = await response.json();
  return data.jobId;
}

/**
 * Check the status of a render job.
 */
export async function checkRenderStatus(jobId: string): Promise<RenderJobStatus> {
  const response = await fetch(`${SERVER_URL}/api/render/${jobId}`);

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Poll until render is complete. Returns the video URL.
 */
export async function waitForRender(
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const status = await checkRenderStatus(jobId);

        if (status.progress !== undefined) {
          onProgress?.(status.progress);
        }

        if (status.status === "done" && status.videoUrl) {
          clearInterval(interval);
          resolve(`${SERVER_URL}${status.videoUrl}`);
        }

        if (status.status === "error") {
          clearInterval(interval);
          reject(new Error(status.error || "Render failed"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 2000); // Poll every 2 seconds

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error("Render timeout"));
    }, 300000);
  });
}

/**
 * Get the full download URL for the rendered video.
 */
export function getVideoDownloadUrl(videoUrl: string): string {
  return videoUrl.startsWith("http") ? videoUrl : `${SERVER_URL}${videoUrl}`;
}

/**
 * Share a video URL using the native share sheet.
 */
export async function shareVideo(videoUrl: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing not available on this device");
  }
  await Sharing.shareAsync(videoUrl, {
    mimeType: "video/mp4",
    dialogTitle: "Share your GRIT highlight",
  });
}

/**
 * Full pipeline: submit → poll → return video URL.
 */
export async function renderAndGetUrl(
  input: MontageInput,
  onProgress?: (progress: number) => void
): Promise<string> {
  onProgress?.(0);

  const jobId = await submitRenderJob(input);
  onProgress?.(5);

  const videoUrl = await waitForRender(jobId, (p) => {
    onProgress?.(5 + Math.round(p * 0.95));
  });

  onProgress?.(100);
  return videoUrl;
}
