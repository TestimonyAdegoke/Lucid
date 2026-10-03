import { db } from "@tardemah/database";
import { sanitizeAppearance, systemEntryTemplates } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, route, text } from "@/lib/api";
import { appearanceWrites, loadPreferences, serializePreferences } from "@/lib/preferences";
import { getRequestContext } from "@/lib/session";
import { findEntryTemplate, listJournalStyles } from "@/lib/templates";

export const runtime = "nodejs";

export const GET = route("load preferences", async (request: Request) => {
  const context = await getRequestContext(request);
  return NextResponse.json({ preferences: await loadPreferences(context) });
});

/**
 * Updates the caller's look for the active dream book. Accepts individual appearance fields,
 * and/or `styleKey` to apply a whole style template (built-in or saved in this workspace).
 */
export const PATCH = route("update preferences", async (request: Request) => {
  const context = await getRequestContext(request);
  const body = await readJson(request);

  let appearance = sanitizeAppearance(body.appearance ?? body);
  let styleKey: string | undefined;
  let replaceDesign = false;

  if (typeof body.styleKey === "string") {
    const style = (await listJournalStyles(context.workspaceId)).find((item) => item.key === body.styleKey);
    if (!style) throw new ApiError(404, "That journal style is not available in this dream book.");
    appearance = { ...style.appearance, ...appearance };
    styleKey = style.key;
    replaceDesign = true;
  } else if (Object.keys(appearance).length) {
    styleKey = "custom";
  }

  let defaultEntryTemplate: string | undefined;
  if (typeof body.defaultEntryTemplate === "string") {
    const template = await findEntryTemplate(context.workspaceId, body.defaultEntryTemplate);
    defaultEntryTemplate = template?.id ?? systemEntryTemplates[0].id;
  }

  const displayName = body.displayName === null ? null : text(body.displayName, 60);

  const current = await db.journalPreference.findUnique({
    where: { userId_workspaceId: { userId: context.userId, workspaceId: context.workspaceId } },
    select: { design: true },
  });

  const data = {
    ...appearanceWrites(appearance, current?.design ?? {}, replaceDesign),
    styleKey,
    defaultEntryTemplate,
    displayName: displayName === "" ? null : displayName,
  };

  const row = await db.journalPreference.upsert({
    where: { userId_workspaceId: { userId: context.userId, workspaceId: context.workspaceId } },
    update: data,
    create: { userId: context.userId, workspaceId: context.workspaceId, ...data },
  });

  return NextResponse.json({ preferences: serializePreferences(row) });
});
