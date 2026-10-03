import { db } from "@tardemah/database";
import { sanitizeDefaults, sanitizePrompts } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, requireRole, route, text } from "@/lib/api";
import { workspaceEntitlements } from "@/lib/entitlements";
import { getRequestContext } from "@/lib/session";
import { listEntryTemplates, serializeEntryTemplate } from "@/lib/templates";

export const runtime = "nodejs";

export const GET = route("list templates", async (request: Request) => {
  const context = await getRequestContext(request);
  return NextResponse.json({ templates: await listEntryTemplates(context.workspaceId) });
});

/** Creates a custom entry template shared with everyone in the active dream book. */
export const POST = route("create template", async (request: Request) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const body = await readJson(request);

  const name = text(body.name, 60);
  if (!name) throw new ApiError(400, "Give your template a name.");

  const { limits } = await workspaceEntitlements(context.workspaceId);
  const count = await db.entryTemplate.count({ where: { workspaceId: context.workspaceId, archivedAt: null } });
  if (count >= limits.customEntryTemplates) {
    throw new ApiError(402, "This dream book has reached its custom template limit.", "limit");
  }

  const row = await db.entryTemplate.create({
    data: {
      workspaceId: context.workspaceId,
      createdById: context.userId,
      name,
      description: text(body.description, 200) ?? "",
      icon: text(body.icon, 4) || "✎",
      prompts: sanitizePrompts(body.prompts),
      defaults: sanitizeDefaults(body.defaults),
    },
  });

  return NextResponse.json({ template: serializeEntryTemplate(row) }, { status: 201 });
});
