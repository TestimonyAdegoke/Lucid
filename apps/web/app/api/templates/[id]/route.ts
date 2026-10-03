import { db } from "@tardemah/database";
import { hasRole, sanitizeDefaults, sanitizePrompts } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, requireRole, route, text } from "@/lib/api";
import { getRequestContext, type RequestContext } from "@/lib/session";
import { serializeEntryTemplate } from "@/lib/templates";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Creators manage their own templates; owners/admins can manage any template in their book. */
async function findManageable(context: RequestContext, id: string) {
  const row = await db.entryTemplate.findFirst({ where: { id, workspaceId: context.workspaceId, archivedAt: null } });
  if (!row) throw new ApiError(404, "Template not found.");
  if (row.createdById !== context.userId && !hasRole(context.role, "ADMIN")) {
    throw new ApiError(403, "Only the person who made this template can change it.");
  }
  return row;
}

export const PATCH = route("update template", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;
  await findManageable(context, id);
  const body = await readJson(request);

  const name = body.name === undefined ? undefined : text(body.name, 60);
  if (name === "") throw new ApiError(400, "A template needs a name.");

  const row = await db.entryTemplate.update({
    where: { id },
    data: {
      name,
      description: body.description === undefined ? undefined : text(body.description, 200) ?? "",
      icon: body.icon === undefined ? undefined : text(body.icon, 4) || "✎",
      prompts: body.prompts === undefined ? undefined : sanitizePrompts(body.prompts),
      defaults: body.defaults === undefined ? undefined : sanitizeDefaults(body.defaults),
    },
  });

  return NextResponse.json({ template: serializeEntryTemplate(row) });
});

/** Archives rather than deletes, so existing pages keep their template snapshot and link. */
export const DELETE = route("archive template", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;
  await findManageable(context, id);

  await db.entryTemplate.update({ where: { id }, data: { archivedAt: new Date() } });
  await db.journalPreference.updateMany({
    where: { workspaceId: context.workspaceId, defaultEntryTemplate: id },
    data: { defaultEntryTemplate: "sys:quick" },
  });

  return new Response(null, { status: 204 });
});
