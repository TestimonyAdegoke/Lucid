import { randomBytes } from "node:crypto";
import { db, MembershipRole } from "@tardemah/database";
import { canAssignRole, hasRole, type Role } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, route, text } from "@/lib/api";
import { workspaceEntitlements } from "@/lib/entitlements";
import { getRequestContext, hashToken } from "@/lib/session";
import { inviteTtlMs, membershipFor } from "@/lib/workspaces";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = route("list invitations", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;
  const membership = await membershipFor(context, id);
  if (!hasRole(membership.role, "ADMIN")) throw new ApiError(403, "Only the owner or an admin can see invitations.");

  const invitations = await db.invitation.findMany({
    where: { workspaceId: id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    invitations: invitations.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    })),
  });
});

/** Creates an invitation link. The raw token is only ever returned here, once; only its hash is stored. */
export const POST = route("create invitation", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;
  const membership = await membershipFor(context, id);
  if (!hasRole(membership.role, "ADMIN")) throw new ApiError(403, "Only the owner or an admin can invite people.");
  if (id === context.personalWorkspaceId) throw new ApiError(400, "Your personal dream book is just for you. Create a shared book to invite people.");

  const body = await readJson(request);
  const role = (typeof body.role === "string" ? body.role : "MEMBER") as Role;
  if (!["ADMIN", "MEMBER", "VIEWER"].includes(role) || !canAssignRole(membership.role, role)) {
    throw new ApiError(403, "You can't invite someone with that role.");
  }

  const email = text(body.email, 200)?.toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "That email doesn't look right.");

  const { limits } = await workspaceEntitlements(id);
  const [members, pending] = await Promise.all([
    db.membership.count({ where: { workspaceId: id } }),
    db.invitation.count({ where: { workspaceId: id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);
  if (members + pending >= limits.membersPerWorkspace) {
    throw new ApiError(402, "This dream book has no free seats on its plan.", "limit");
  }

  const token = randomBytes(24).toString("base64url");
  const invitation = await db.invitation.create({
    data: {
      workspaceId: id,
      email,
      role: MembershipRole[role],
      tokenHash: hashToken(token),
      invitedById: context.userId,
      expiresAt: new Date(Date.now() + inviteTtlMs),
    },
  });

  const origin = new URL(request.url).origin;
  return NextResponse.json({
    invitation: { id: invitation.id, email, role, expiresAt: invitation.expiresAt.toISOString() },
    link: origin + "/invite/" + token,
  }, { status: 201 });
});
