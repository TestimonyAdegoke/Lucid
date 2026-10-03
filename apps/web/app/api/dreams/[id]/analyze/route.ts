import { NextResponse } from "next/server";
import { db } from "@tardemah/database";
import { ApiError, requireRole, route } from "@/lib/api";
import { getRequestContext } from "@/lib/session";
import { analyzeDreamById } from "@/lib/dream-analysis";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = route("analyze dream", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;

  const dream = await db.dream.findFirst({
    where: { id, workspaceId: context.workspaceId, authorId: context.userId },
    select: { id: true },
  });
  if (!dream) throw new ApiError(404, "Dream not found.");

  await analyzeDreamById(dream.id);
  return NextResponse.json({ ok: true });
});
