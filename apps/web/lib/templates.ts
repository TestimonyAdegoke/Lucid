import { db } from "@tardemah/database";
import {
  completeAppearance,
  journalStyles,
  sanitizeDefaults,
  sanitizePrompts,
  systemEntryTemplates,
  type Appearance,
  type EntryTemplate,
} from "@tardemah/domain";

type EntryTemplateRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompts: unknown;
  defaults: unknown;
  createdById: string;
};

export function serializeEntryTemplate(row: EntryTemplateRow): EntryTemplate & { createdById: string } {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    prompts: sanitizePrompts(row.prompts),
    defaults: sanitizeDefaults(row.defaults),
    system: false,
    createdById: row.createdById,
  };
}

export async function listEntryTemplates(workspaceId: string) {
  const rows = await db.entryTemplate.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return [...systemEntryTemplates, ...rows.map(serializeEntryTemplate)];
}

/** Finds a built-in or workspace template. Never returns another workspace's template. */
export async function findEntryTemplate(workspaceId: string, id: string): Promise<EntryTemplate | null> {
  const system = systemEntryTemplates.find((template) => template.id === id);
  if (system) return system;
  const row = await db.entryTemplate.findFirst({ where: { id, workspaceId, archivedAt: null } });
  return row ? serializeEntryTemplate(row) : null;
}

export type StyleSummary = {
  key: string;
  name: string;
  description: string;
  appearance: Appearance;
  system: boolean;
  createdById?: string;
};

export async function listJournalStyles(workspaceId: string): Promise<StyleSummary[]> {
  const rows = await db.journalStyle.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  return [
    ...journalStyles.map((style) => ({ ...style, system: true })),
    ...rows.map((row) => ({
      key: row.id,
      name: row.name,
      description: row.description,
      appearance: completeAppearance(row.appearance),
      system: false,
      createdById: row.createdById,
    })),
  ];
}
