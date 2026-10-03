/**
 * Entry templates shape how a dream is captured: a set of optional prompts plus defaults.
 * Built-in templates live here; workspace templates are stored in Postgres with the same shape.
 */

export type PromptKind = "text" | "longtext" | "scale" | "choice" | "toggle";

export type TemplatePrompt = {
  id: string;
  label: string;
  kind: PromptKind;
  placeholder?: string;
  options?: string[];
};

export type TemplateDefaults = {
  mood?: string;
  tags?: string[];
  isLucid?: boolean;
  isNightmare?: boolean;
};

export type EntryTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompts: TemplatePrompt[];
  defaults: TemplateDefaults;
  system: boolean;
};

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export const moodOptions = ["peaceful", "happy", "curious", "nostalgic", "anxious", "strange", "sad", "awed"];

export const systemEntryTemplates: EntryTemplate[] = [
  {
    id: "sys:quick", name: "Quick capture", icon: "☾", system: true,
    description: "Just the dream, before it slips away.",
    prompts: [], defaults: {},
  },
  {
    id: "sys:full-recall", name: "Full recall", icon: "✦", system: true,
    description: "Walk back through the dream scene by scene.",
    prompts: [
      { id: "setting", label: "Where were you?", kind: "text", placeholder: "A house that was also a school…" },
      { id: "people", label: "Who was there?", kind: "text", placeholder: "Mum, a stranger in a yellow coat…" },
      { id: "turning", label: "What changed or surprised you?", kind: "longtext" },
      { id: "ending", label: "How did it end — or where did you wake?", kind: "longtext" },
      { id: "senses", label: "Colours, sounds, textures", kind: "text" },
    ],
    defaults: {},
  },
  {
    id: "sys:lucid", name: "Lucid practice", icon: "◐", system: true,
    description: "Log reality checks, dream signs and what you did once aware.",
    prompts: [
      { id: "check", label: "Reality check that worked", kind: "choice", options: ["looked at hands", "re-read text", "light switch", "nose pinch", "clock", "just knew"] },
      { id: "sign", label: "The dream sign I noticed", kind: "text", placeholder: "The stairs went on forever…" },
      { id: "clarity", label: "How clear was the lucidity?", kind: "scale" },
      { id: "action", label: "What I chose to do", kind: "longtext" },
      { id: "intention", label: "Intention for tonight", kind: "text" },
    ],
    defaults: { isLucid: true, tags: ["lucid-practice"] },
  },
  {
    id: "sys:nightmare", name: "Gentle nightmare log", icon: "☁", system: true,
    description: "Set it down safely, then imagine a kinder ending.",
    prompts: [
      { id: "threat", label: "What felt most frightening?", kind: "longtext" },
      { id: "body", label: "How intense did it feel on waking?", kind: "scale" },
      { id: "rewrite", label: "If you could change the ending, what would happen?", kind: "longtext", placeholder: "The door opens onto a garden instead…" },
      { id: "grounding", label: "Something steady around you right now", kind: "text", placeholder: "The light through the curtain…" },
    ],
    defaults: { isNightmare: true, mood: "anxious" },
  },
  {
    id: "sys:recurring", name: "Recurring dream", icon: "∞", system: true,
    description: "Notice what returns — and what is different this time.",
    prompts: [
      { id: "same", label: "What was the same as before?", kind: "longtext" },
      { id: "different", label: "What was different this time?", kind: "longtext" },
      { id: "first", label: "When do you first remember this dream?", kind: "text" },
    ],
    defaults: { tags: ["recurring"] },
  },
  {
    id: "sys:fragments", name: "Fragments", icon: "⁂", system: true,
    description: "Half-remembered pieces. No story required.",
    prompts: [
      { id: "images", label: "Images that stayed", kind: "text" },
      { id: "feeling", label: "One word for the feeling", kind: "text" },
      { id: "colour", label: "A colour from the dream", kind: "text" },
    ],
    defaults: { tags: ["fragment"] },
  },
  {
    id: "sys:waking-links", name: "Waking-life links", icon: "⌁", system: true,
    description: "Gently notice echoes between the day and the dream — no verdicts.",
    prompts: [
      { id: "yesterday", label: "What was on your mind yesterday?", kind: "longtext" },
      { id: "echo", label: "Anything from the day that showed up?", kind: "text" },
      { id: "question", label: "A question to sit with", kind: "text" },
    ],
    defaults: {},
  },
];

const PROMPT_KINDS = new Set<PromptKind>(["text", "longtext", "scale", "choice", "toggle"]);

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

/** Validates untrusted prompt definitions for a custom template. */
export function sanitizePrompts(input: unknown): TemplatePrompt[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const prompts: TemplatePrompt[] = [];

  for (const raw of input.slice(0, 12)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const label = cleanString(item.label, 140);
    const kind = item.kind as PromptKind;
    if (!label || !PROMPT_KINDS.has(kind)) continue;

    let id = slug(cleanString(item.id, 40) || label) || "prompt";
    while (seen.has(id)) id += "-x";
    seen.add(id);

    const prompt: TemplatePrompt = { id, label, kind };
    const placeholder = cleanString(item.placeholder, 140);
    if (placeholder) prompt.placeholder = placeholder;
    if (kind === "choice") {
      const options = Array.isArray(item.options)
        ? [...new Set(item.options.map((option) => cleanString(option, 40)).filter(Boolean))].slice(0, 10)
        : [];
      if (options.length < 2) continue;
      prompt.options = options;
    }
    prompts.push(prompt);
  }

  return prompts;
}

export function sanitizeDefaults(input: unknown): TemplateDefaults {
  if (!input || typeof input !== "object") return {};
  const value = input as Record<string, unknown>;
  const defaults: TemplateDefaults = {};
  const mood = cleanString(value.mood, 50);
  if (mood) defaults.mood = mood;
  if (Array.isArray(value.tags)) {
    const tags = value.tags.map((tag) => cleanString(tag, 40).toLowerCase().replace(/^#/, "")).filter(Boolean);
    if (tags.length) defaults.tags = [...new Set(tags)].slice(0, 8);
  }
  if (typeof value.isLucid === "boolean") defaults.isLucid = value.isLucid;
  if (typeof value.isNightmare === "boolean") defaults.isNightmare = value.isNightmare;
  return defaults;
}

/** Keeps only answers that match the template's prompts and their kinds. */
export function sanitizeFieldValues(prompts: TemplatePrompt[], input: unknown): FieldValues {
  if (!input || typeof input !== "object") return {};
  const value = input as Record<string, unknown>;
  const result: FieldValues = {};

  for (const prompt of prompts) {
    const answer = value[prompt.id];
    if (answer === undefined || answer === null || answer === "") continue;

    if (prompt.kind === "scale") {
      const number = typeof answer === "number" ? answer : Number(answer);
      if (Number.isFinite(number)) result[prompt.id] = Math.max(1, Math.min(10, Math.round(number)));
    } else if (prompt.kind === "toggle") {
      if (typeof answer === "boolean") result[prompt.id] = answer;
    } else if (prompt.kind === "choice") {
      if (typeof answer === "string" && prompt.options?.includes(answer)) result[prompt.id] = answer;
    } else if (typeof answer === "string" && answer.trim()) {
      result[prompt.id] = answer.trim().slice(0, prompt.kind === "longtext" ? 8000 : 500);
    }
  }

  return result;
}

/** Plain-text rendering of template answers, used for search and dream analysis. */
export function fieldValuesToText(prompts: TemplatePrompt[], values: FieldValues) {
  return prompts
    .filter((prompt) => values[prompt.id] !== undefined && prompt.kind !== "scale" && prompt.kind !== "toggle")
    .map((prompt) => prompt.label + " " + String(values[prompt.id]))
    .join("\n");
}
