import { db } from "@tardemah/database";
import { hasRole } from "@tardemah/domain";
import { ApiError, route } from "@/lib/api";
import { getRequestContext } from "@/lib/session";
import { membershipFor } from "@/lib/workspaces";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; inviteId: string }> };

export const DELETE = route("revoke invitation", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id, inviteId } = await params;
  const membership = await membershipFor(context, id);
  if (!hasRole(membership.role, "ADMIN")) throw new ApiError(403, "Only the owner or an admin can revoke invitations.");

  const result = await db.invitation.updateMany({
    where: { id: inviteId, workspaceId: id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) throw new ApiError(404, "Invitation not found.");
  return new Response(null, { status: 204 });
});
