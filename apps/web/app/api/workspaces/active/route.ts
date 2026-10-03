import { db } from "@tardemah/database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError, readJson, route } from "@/lib/api";
import { getRequestContext, WORKSPACE_COOKIE, workspaceCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

/** Switches which dream book this browser is writing in. Mobile clients send `x-tardemah-workspace` instead. */
export const POST = route("switch workspace", async (request: Request) => {
  const context = await getRequestContext(request);
  const body = await readJson(request);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: context.userId, workspaceId } },
    select: { workspaceId: true },
  });
  if (!membership) throw new ApiError(404, "Dream book not found.");

  const cookieStore = await cookies();
  if (workspaceId === context.personalWorkspaceId) {
    cookieStore.delete(WORKSPACE_COOKIE);
  } else {
    cookieStore.set(WORKSPACE_COOKIE, workspaceId, workspaceCookieOptions());
  }

  return NextResponse.json({ activeWorkspaceId: workspaceId });
});
