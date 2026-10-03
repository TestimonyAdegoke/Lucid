import { NextResponse } from "next/server";
import { db } from "@lucid/database";
import { getRequestContext } from "@/lib/session";
import { analyzeDreamById } from "@/lib/dream-analysis";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const context = await getRequestContext(request);
  const { id } = await params;

  const dream = await db.dream.findFirst({
    where: { id, workspaceId: context.workspaceId },
    select: { id: true },
  });

  if (!dream) return NextResponse.json({ error: "Dream not found." }, { status: 404 });

  await analyzeDreamById(dream.id);
  return NextResponse.json({ ok: true });
}
