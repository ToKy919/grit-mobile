/**
 * GRIT — useVideoRender Hook
 * React hook for the video render pipeline.
 */

import { useState, useCallback } from "react";
import { buildMontageInput } from "../services/video/montageBuilder";
import { renderAndGetUrl, shareVideo } from "../services/video/videoRenderService";
import type { WorkoutSession } from "../types/workout";

type RenderState = "idle" | "rendering" | "done" | "error";

export function useVideoRender() {
  const [state, setState] = useState<RenderState>("idle");
  const [progress, setProgress] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const render = useCallback(
    async (
      session: WorkoutSession,
      template: "highlight" | "story" = "highlight",
      personalRecords: string[] = []
    ) => {
      try {
        setState("rendering");
        setProgress(0);
        setError(null);

        const input = buildMontageInput(session, template, personalRecords);
        const uri = await renderAndGetUrl(input, (p) => setProgress(p));

        setVideoUri(uri);
        setState("done");
      } catch (e: any) {
        setError(e.message);
        setState("error");
      }
    },
    []
  );

  const share = useCallback(async () => {
    if (videoUri) {
      await shareVideo(videoUri);
    }
  }, [videoUri]);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setVideoUri(null);
    setError(null);
  }, []);

  return {
    state,
    progress,
    videoUri,
    error,
    render,
    share,
    reset,
  };
}
