import { db } from "@tardemah/database";
import { completeAppearance } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, requireRole, route, text } from "@/lib/api";
import { workspaceEntitlements } from "@/lib/entitlements";
import { getRequestContext } from "@/lib/session";
import { listJournalStyles } from "@/lib/templates";

export const runtime = "nodejs";

export const GET = route("list styles", async (request: Request) => {
  const context = await getRequestContext(request);
  return NextResponse.json({ styles: await listJournalStyles(context.workspaceId) });
});

/** Saves a look as a reusable style template for everyone in the active dream book. */
export const POST = route("save style", async (request: Request) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const body = await readJson(request);

  const name = text(body.name, 60);
  if (!name) throw new ApiError(400, "Give this style a name.");

  const { limits } = await workspaceEntitlements(context.workspaceId);
  const count = await db.journalStyle.count({ where: { workspaceId: context.workspaceId } });
  if (count >= limits.customStyles) {
    throw new ApiError(402, "This dream book has reached its saved style limit.", "limit");
  }

  const appearance = completeAppearance(body.appearance);
  const row = await db.journalStyle.create({
    data: {
      workspaceId: context.workspaceId,
      createdById: context.userId,
      name,
      description: text(body.description, 200) ?? "",
      appearance,
    },
  });

  await db.journalPreference.updateMany({
    where: { userId: context.userId, workspaceId: context.workspaceId },
    data: { styleKey: row.id },
  });

  return NextResponse.json({
    style: { key: row.id, name: row.name, description: row.description, appearance, system: false, createdById: row.createdById },
  }, { status: 201 });
});
