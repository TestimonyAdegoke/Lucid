import { db, MembershipRole } from "@tardemah/database";
import { canAssignRole, hasRole, type Role } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, route } from "@/lib/api";
import { getRequestContext } from "@/lib/session";
import { membershipFor } from "@/lib/workspaces";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

const roles = new Set<Role>(["ADMIN", "MEMBER", "VIEWER"]);

async function loadTarget(workspaceId: string, memberId: string) {
  const target = await db.membership.findFirst({ where: { id: memberId, workspaceId } });
  if (!target) throw new ApiError(404, "Member not found.");
  return target;
}

export const PATCH = route("change member role", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id, memberId } = await params;
  const actor = await membershipFor(context, id);
  const target = await loadTarget(id, memberId);
  const body = await readJson(request);
  const role = body.role as Role;

  if (!roles.has(role)) throw new ApiError(400, "Choose admin, member or viewer.");
  if (target.userId === context.userId) throw new ApiError(400, "You cannot change your own role.");
  if (target.role === "OWNER") throw new ApiError(403, "The owner's role cannot be changed.");
  if (!canAssignRole(actor.role, role) || !canAssignRole(actor.role, target.role as Role)) {
    throw new ApiError(403, "You don't have permission to make that change.");
  }

  const updated = await db.membership.update({ where: { id: memberId }, data: { role: MembershipRole[role] } });
  return NextResponse.json({ member: { id: updated.id, role: updated.role } });
});

/** Removes a member, or lets a member leave. Their private pages in this book leave with them. */
export const DELETE = route("remove member", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id, memberId } = await params;
  const actor = await membershipFor(context, id);
  const target = await loadTarget(id, memberId);
  const leaving = target.userId === context.userId;

  if (target.role === "OWNER") throw new ApiError(400, "The owner cannot leave or be removed. Delete the book instead.");
  if (!leaving && !(hasRole(actor.role, "ADMIN") && canAssignRole(actor.role, target.role as Role))) {
    throw new ApiError(403, "You don't have permission to remove this member.");
  }

  await db.$transaction([
    db.dream.deleteMany({ where: { workspaceId: id, authorId: target.userId, visibility: "PRIVATE" } }),
    db.journalPreference.deleteMany({ where: { workspaceId: id, userId: target.userId } }),
    db.membership.delete({ where: { id: memberId } }),
  ]);

  return new Response(null, { status: 204 });
});
