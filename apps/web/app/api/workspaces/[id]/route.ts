import { db } from "@tardemah/database";
import { hasRole } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, route, text } from "@/lib/api";
import { getRequestContext } from "@/lib/session";
import { membershipFor } from "@/lib/workspaces";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = route("update workspace", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;
  const membership = await membershipFor(context, id);
  if (!hasRole(membership.role, "ADMIN")) throw new ApiError(403, "Only the owner or an admin can rename this book.");
  const body = await readJson(request);

  const name = body.name === undefined ? undefined : text(body.name, 60);
  if (name === "") throw new ApiError(400, "A dream book needs a name.");

  const workspace = await db.workspace.update({
    where: { id },
    data: {
      name,
      description: body.description === undefined ? undefined : text(body.description, 240) || null,
      emoji: body.emoji === undefined ? undefined : text(body.emoji, 4) || null,
    },
  });

  return NextResponse.json({ workspace });
});

/** Permanently deletes a shared dream book and every page in it. Personal books cannot be deleted here. */
export const DELETE = route("delete workspace", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;
  const membership = await membershipFor(context, id);

  if (membership.role !== "OWNER") throw new ApiError(403, "Only the owner can delete this dream book.");
  if (id === context.personalWorkspaceId) throw new ApiError(400, "Your personal dream book cannot be deleted.");

  const body = await readJson(request);
  if (body.confirm !== membership.workspace.name) {
    throw new ApiError(400, "Type the dream book's name to confirm deletion.", "confirm");
  }

  await db.workspace.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
