import { DreamVisibility, type Prisma } from "@tardemah/database";
import {
  sanitizeFieldValues,
  sanitizePrompts,
  type EntryTemplate,
  type FieldValues,
  type TemplatePrompt,
} from "@tardemah/domain";
import type { RequestContext } from "@/lib/session";

export const dreamInclude = {
  dreamTags: { include: { tag: true } },
  author: { select: { id: true, name: true } },
} as const;

type DreamWithTags = {
  id: string;
  clientId: string | null;
  authorId: string;
  title: string;
  content: string;
  dreamedAt: Date;
  mood: string | null;
  vividness: number | null;
  sleepQuality: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
  visibility: DreamVisibility;
  templateKey: string | null;
  fields: Prisma.JsonValue | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  dreamTags: Array<{ tag: { name: string } }>;
  author?: { id: string; name: string | null };
};

/** The template snapshot stored with a dream so it renders even if the template later changes. */
export type DreamFields = {
  template: { id: string; name: string; icon: string };
  prompts: TemplatePrompt[];
  values: FieldValues;
};

function readFields(value: Prisma.JsonValue | null): DreamFields | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!record.template || !Array.isArray(record.prompts) || !record.values) return null;
  return record as unknown as DreamFields;
}

export function serializeDream(dream: DreamWithTags, viewerId?: string) {
  return {
    id: dream.id,
    clientId: dream.clientId,
    title: dream.title,
    content: dream.content,
    dreamedAt: dream.dreamedAt.toISOString(),
    mood: dream.mood,
    vividness: dream.vividness,
    sleepQuality: dream.sleepQuality,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
    visibility: dream.visibility,
    templateKey: dream.templateKey,
    fields: readFields(dream.fields),
    source: dream.source,
    tags: dream.dreamTags.map((item) => item.tag.name),
    author: dream.author ? { id: dream.author.id, name: dream.author.name } : null,
    isMine: viewerId ? dream.authorId === viewerId : true,
    createdAt: dream.createdAt.toISOString(),
    updatedAt: dream.updatedAt.toISOString(),
  };
}

export function cleanTags(input: unknown) {
  if (!Array.isArray(input)) return [];

  return [...new Set(
    input
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase().replace(/^#/, "").slice(0, 40))
      .filter(Boolean),
  )].slice(0, 20);
}

/** Dreams the caller may read in the active workspace: their own, plus pages others chose to share. */
export function visibleDreamsWhere(context: RequestContext): Prisma.DreamWhereInput {
  return {
    workspaceId: context.workspaceId,
    OR: [{ authorId: context.userId }, { visibility: DreamVisibility.WORKSPACE }],
  };
}

export function tagWrites(workspaceId: string, tags: string[]) {
  return tags.map((name) => ({
    tag: {
      connectOrCreate: {
        where: { workspaceId_name: { workspaceId, name } },
        create: { workspaceId, name },
      },
    },
  }));
}

export function parseVisibility(value: unknown) {
  if (value === "WORKSPACE") return DreamVisibility.WORKSPACE;
  if (value === "PRIVATE") return DreamVisibility.PRIVATE;
  return undefined;
}

const ownQuestions = { id: "custom", name: "My questions", icon: "✎" };

/**
 * Snapshots the questions answered on a page. Questions may come straight from a template, or be the
 * writer's own for this page (a template's prompts edited, trimmed or extended — or none at all).
 */
export function buildFields(template: EntryTemplate | null, prompts: TemplatePrompt[], values: unknown): DreamFields | null {
  if (!prompts.length) return null;
  const clean = sanitizeFieldValues(prompts, values);
  if (!Object.keys(clean).length) return null;
  return {
    template: template && template.prompts.length ? { id: template.id, name: template.name, icon: template.icon } : ownQuestions,
    // Only answered questions are kept, so skipped prompts don't clutter the page.
    prompts: prompts.filter((prompt) => clean[prompt.id] !== undefined),
    values: clean,
  };
}

/** Accepts the writer's own question list for a single page, if one was sent. */
export function customPrompts(input: unknown) {
  return Array.isArray(input) ? sanitizePrompts(input) : null;
}

export function clampScale(value: unknown) {
  return Number.isInteger(value) ? Math.max(1, Math.min(10, value as number)) : undefined;
}

export type SerializedDream = ReturnType<typeof serializeDream>;
