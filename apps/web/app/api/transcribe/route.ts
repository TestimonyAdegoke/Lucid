import { NextResponse } from "next/server";
import { ApiError, requireRole, route } from "@/lib/api";
import { consumeMonthlyUsage, refundMonthlyUsage, workspaceEntitlements } from "@/lib/entitlements";
import { getRequestContext } from "@/lib/session";
import { isTranscriptionConfigured, transcribeAudio } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export const POST = route("transcribe", async (request: Request) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");

  if (!isTranscriptionConfigured()) {
    throw new ApiError(503, "Voice transcription is not configured for this Tardemah environment yet.");
  }

  const form = await request.formData();
  const value = form.get("audio") ?? form.get("file");

  if (!(value instanceof File)) throw new ApiError(400, "No audio recording was received.");
  if (!value.size) throw new ApiError(400, "The recording is empty.");
  if (value.size > MAX_AUDIO_BYTES) {
    throw new ApiError(413, "That recording is too large. Keep a single voice capture under 20 MB.");
  }

  const { limits } = await workspaceEntitlements(context.workspaceId);
  await consumeMonthlyUsage(context.workspaceId, "transcription", limits.transcriptionsPerMonth);

  try {
    const transcript = await transcribeAudio(value);
    return NextResponse.json({ transcript, retainedAudio: false });
  } catch (error) {
    await refundMonthlyUsage(context.workspaceId, "transcription");
    console.error("Dream transcription failed", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("429") || message.includes("insufficient_quota") || message.includes("quota")) {
      throw new ApiError(502, "Voice transcription is temporarily unavailable: OpenAI API credit quota has been exhausted. Please top up API credits.");
    }
    throw new ApiError(502, "Tardemah could not transcribe that recording. Check OpenAI configuration or try again.");
  }
});
