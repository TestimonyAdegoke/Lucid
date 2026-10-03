import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/session";
import { OpenAIConfigurationError, transcribeAudio } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await getRequestContext(request);
    const form = await request.formData();
    const value = form.get("audio") ?? form.get("file");

    if (!(value instanceof File)) {
      return NextResponse.json({ error: "No audio recording was received." }, { status: 400 });
    }

    if (!value.size) {
      return NextResponse.json({ error: "The recording is empty." }, { status: 400 });
    }

    if (value.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "That recording is too large. Keep a single voice capture under 20 MB." }, { status: 413 });
    }

    const transcript = await transcribeAudio(value);
    return NextResponse.json({ transcript, retainedAudio: false });
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      return NextResponse.json(
        { error: "Voice transcription is not configured for this Lucid environment yet." },
        { status: 503 },
      );
    }

    console.error("Dream transcription failed", error);
    return NextResponse.json({ error: "Lucid could not transcribe that recording." }, { status: 502 });
  }
}
