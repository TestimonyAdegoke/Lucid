"use client";

import { LoaderCircle, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function VoiceCapture({ onTranscript }: { onTranscript: (text: string) => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    setError(null);

    try {
      const extension = blob.type.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.append("audio", new File([blob], "dream." + extension, { type: blob.type || "audio/webm" }));

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      });

      const payload = await response.json().catch(() => ({})) as { transcript?: string; error?: string };
      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error || "Tardemah could not transcribe that recording.");
      }

      onTranscript(payload.transcript);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not transcribe that recording.");
    } finally {
      setTranscribing(false);
    }
  }

  async function start() {
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError("Voice capture is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        if (blob.size) void transcribe(blob);
      };

      recorder.start();
      setRecording(true);
    } catch {
      setError("Tardemah needs microphone permission to hear your dream.");
    }
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <div className={"voice-capture " + (recording ? "recording" : "")}>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={transcribing}
        aria-label={recording ? "Stop dream recording" : "Record dream by voice"}
      >
        {transcribing ? <LoaderCircle className="voice-spinner" size={16} /> : recording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
        <span>{transcribing ? "Turning your voice into a page..." : recording ? "I'm listening — tap to stop" : "Speak the dream instead"}</span>
      </button>
      <small>{recording ? "Say it however you remember it." : "The recording is discarded after transcription."}</small>
      {error && <p>{error}</p>}
    </div>
  );
}
