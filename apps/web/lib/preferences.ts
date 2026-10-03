import { db, type Prisma } from "@tardemah/database";
import { columnAppearanceKeys, completeAppearance, type Appearance } from "@tardemah/domain";
import type { RequestContext } from "@/lib/session";

export async function loadPreferences(context: Pick<RequestContext, "userId" | "workspaceId">) {
  const row = await db.journalPreference.upsert({
    where: { userId_workspaceId: { userId: context.userId, workspaceId: context.workspaceId } },
    update: {},
    create: { userId: context.userId, workspaceId: context.workspaceId },
  });
  return serializePreferences(row);
}

type PreferenceRow = {
  theme: string;
  cover: string;
  typography: string;
  promptStyle: string;
  pageDensity: string;
  paper: string;
  accentColor: string | null;
  showOrnaments: boolean;
  styleKey: string;
  defaultEntryTemplate: string;
  displayName: string | null;
  design: Prisma.JsonValue;
};

export function serializePreferences(row: PreferenceRow) {
  const design = row.design && typeof row.design === "object" && !Array.isArray(row.design) ? row.design : {};
  const appearance: Appearance = completeAppearance({
    ...design,
    theme: row.theme,
    typography: row.typography,
    cover: row.cover,
    paper: row.paper,
    pageDensity: row.pageDensity,
    promptStyle: row.promptStyle,
    accentColor: row.accentColor,
    showOrnaments: row.showOrnaments,
    ...("ornamentSet" in design ? { ornamentSet: design.ornamentSet } : {}),
  });

  return {
    appearance,
    styleKey: row.styleKey,
    defaultEntryTemplate: row.defaultEntryTemplate,
    displayName: row.displayName,
  };
}

/**
 * Splits a (partial, already sanitized) appearance into column updates and the merged `design` JSON.
 * Pass `replace` when applying a whole style so stale free-form choices don't linger.
 */
export function appearanceWrites(patch: Partial<Appearance>, currentDesign: Prisma.JsonValue, replace = false) {
  const columns: Record<string, unknown> = {};
  const designPatch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(patch)) {
    if ((columnAppearanceKeys as readonly string[]).includes(key)) columns[key] = value;
    else designPatch[key] = value;
  }

  const base = !replace && currentDesign && typeof currentDesign === "object" && !Array.isArray(currentDesign) ? currentDesign : {};
  const touchesDesign = replace || Object.keys(designPatch).length > 0;
  return {
    ...columns,
    ...(touchesDesign ? { design: { ...base, ...designPatch } as Prisma.InputJsonObject } : {}),
  };
}

export type SerializedPreferences = ReturnType<typeof serializePreferences>;
