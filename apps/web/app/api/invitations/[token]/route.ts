import { db } from "@tardemah/database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError, route } from "@/lib/api";
import { isAuthConfigured } from "@/lib/auth/server";
import { getRequestContext, hashToken, WORKSPACE_COOKIE, workspaceCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

async function findOpenInvitation(token: string) {
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      workspace: { select: { id: true, name: true, emoji: true, description: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    throw new ApiError(404, "This invitation has expired or was already used.");
  }
  return invitation;
}

/** Public preview of an invitation (no journal is created by viewing it). */
export const GET = route("preview invitation", async (_request: Request, { params }: RouteContext) => {
  const { token } = await params;
  const invitation = await findOpenInvitation(token);
  return NextResponse.json({
    invitation: {
      workspace: invitation.workspace,
      role: invitation.role,
      invitedBy: invitation.invitedBy.name,
      emailRestricted: Boolean(invitation.email),
      requiresAccount: isAuthConfigured(),
    },
  });
});

export const POST = route("accept invitation", async (request: Request, { params }: RouteContext) => {
  const { token } = await params;
  const invitation = await findOpenInvitation(token);
  const context = await getRequestContext(request);

  if (isAuthConfigured() && !context.authenticated) {
    throw new ApiError(401, "Create an account or sign in to join a shared dream book.", "auth");
  }

  if (invitation.email) {
    const user = await db.user.findUnique({ where: { id: context.userId }, select: { email: true } });
    if (user?.email?.toLowerCase() !== invitation.email) {
      throw new ApiError(403, "This invitation was sent to a different email address.");
    }
  }

  await db.$transaction(async (tx) => {
    // Single-use: the conditional update fails if another request accepted it first.
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (!claimed.count) throw new ApiError(409, "This invitation was just used.");

    const existing = await tx.membership.findUnique({
      where: { userId_workspaceId: { userId: context.userId, workspaceId: invitation.workspaceId } },
    });
    if (!existing) {
      await tx.membership.create({
        data: { userId: context.userId, workspaceId: invitation.workspaceId, role: invitation.role },
      });
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, invitation.workspaceId, workspaceCookieOptions());

  return NextResponse.json({ workspaceId: invitation.workspaceId });
});
