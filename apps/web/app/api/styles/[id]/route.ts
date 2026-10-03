import { db } from "@tardemah/database";
import { hasRole } from "@tardemah/domain";
import { ApiError, requireRole, route } from "@/lib/api";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = route("delete style", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;

  const style = await db.journalStyle.findFirst({ where: { id, workspaceId: context.workspaceId } });
  if (!style) throw new ApiError(404, "Style not found.");
  if (style.createdById !== context.userId && !hasRole(context.role, "ADMIN")) {
    throw new ApiError(403, "Only the person who saved this style can remove it.");
  }

  await db.journalStyle.delete({ where: { id } });
  // Anyone using it keeps their current look; it just stops being a named preset.
  await db.journalPreference.updateMany({ where: { workspaceId: context.workspaceId, styleKey: id }, data: { styleKey: "custom" } });
  return new Response(null, { status: 204 });
});
