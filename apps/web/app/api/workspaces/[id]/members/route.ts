import { db } from "@tardemah/database";
import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getRequestContext } from "@/lib/session";
import { membershipFor } from "@/lib/workspaces";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = route("list members", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;
  await membershipFor(context, id);

  const members = await db.membership.findMany({
    where: { workspaceId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          preferences: { where: { workspaceId: id }, select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.createdAt.toISOString(),
      name: member.user.preferences[0]?.displayName || member.user.name || "A quiet dreamer",
      email: member.user.email,
      isYou: member.userId === context.userId,
    })),
  });
});
