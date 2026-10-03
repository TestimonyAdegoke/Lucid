const OPENAI_API_BASE = "https://api.openai.com/v1";

export class OpenAIConfigurationError extends Error {}

function apiKey() {
  const value = process.env.OPENAI_API_KEY?.trim();
  if (!value) throw new OpenAIConfigurationError("OPENAI_API_KEY is not configured.");
  return value;
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isTranscriptionConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim());
}

export async function transcribeAudio(file: File) {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // Prefer Groq (fast & free tier with whisper-large-v3-turbo) if available
  if (groqKey) {
    const form = new FormData();
    form.append("file", file, file.name || "dream-audio.webm");
    form.append("model", process.env.GROQ_TRANSCRIPTION_MODEL?.trim() || "whisper-large-v3-turbo");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + groqKey },
      body: form,
    });

    if (response.ok) {
      const payload = (await response.json()) as { text?: string };
      if (payload.text?.trim()) return payload.text.trim();
    } else {
      const detail = await response.text().catch(() => "");
      console.warn("Groq transcription failed (" + response.status + "), falling back to OpenAI if available:", detail.slice(0, 200));
      if (!openAiKey) {
        throw new Error("Groq transcription failed: " + response.status + " " + detail.slice(0, 300));
      }
    }
  }

  // OpenAI transcription
  if (openAiKey) {
    const form = new FormData();
    form.append("file", file, file.name || "dream-audio.webm");
    form.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "whisper-1");

    const response = await fetch(OPENAI_API_BASE + "/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + openAiKey },
      body: form,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("Transcription failed: " + response.status + " " + detail.slice(0, 300));
    }

    const payload = (await response.json()) as { text?: string };
    if (!payload.text?.trim()) throw new Error("Transcription returned no text.");
    return payload.text.trim();
  }

  throw new OpenAIConfigurationError("Neither GROQ_API_KEY nor OPENAI_API_KEY is configured.");
}

function readResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") chunks.push(text);
    }
  }

  return chunks.join("\n");
}

export type ExtractedEntity = {
  kind: "PERSON" | "PLACE" | "OBJECT" | "SYMBOL" | "THEME";
  label: string;
  normalized: string;
  confidence: number;
};

export async function extractDreamEntities(input: {
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
}) {
  const key = apiKey();
  const model = process.env.OPENAI_ANALYSIS_MODEL?.trim() || "gpt-6-luna";

  const response = await fetch(OPENAI_API_BASE + "/responses", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content:
            "You extract observable dream-journal structure. Never tell the user what a dream means. " +
            "Do not diagnose, spiritualize, predict, or infer hidden motives. Extract only people, places, concrete objects, " +
            "surface-level symbols/images, and explicit themes/actions that are present in the text. Return JSON only.",
        },
        {
          role: "user",
          content:
            "Return exactly one JSON object with an entities array. Each entity must have kind (PERSON, PLACE, OBJECT, SYMBOL, or THEME), " +
            "label, normalized (lowercase canonical phrase), and confidence from 0 to 1. Keep at most 16 useful entities.\n\n" +
            "Title: " + input.title + "\nMood: " + (input.mood ?? "unspoken") +
            "\nUser tags: " + input.tags.join(", ") + "\nDream:\n" + input.content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Dream extraction failed: " + response.status + " " + detail.slice(0, 300));
  }

  const raw = readResponseText(await response.json());
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Dream extraction returned invalid JSON.");

  const parsed = JSON.parse(raw.slice(start, end + 1)) as { entities?: unknown[] };
  const allowed = new Set(["PERSON", "PLACE", "OBJECT", "SYMBOL", "THEME"]);
  const entities: ExtractedEntity[] = [];

  for (const value of parsed.entities ?? []) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const kind = typeof item.kind === "string" ? item.kind.toUpperCase() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const normalized = typeof item.normalized === "string" ? item.normalized.trim().toLowerCase() : label.toLowerCase();
    const confidence = typeof item.confidence === "number" ? item.confidence : 0.7;

    if (!allowed.has(kind) || !label || !normalized) continue;
    entities.push({
      kind: kind as ExtractedEntity["kind"],
      label: label.slice(0, 120),
      normalized: normalized.slice(0, 120),
      confidence: Math.max(0, Math.min(1, confidence)),
    });
  }

  return { model, entities: entities.slice(0, 16) };
}
