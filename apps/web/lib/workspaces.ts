import { randomBytes } from "node:crypto";
import { db } from "@tardemah/database";
import type { Role } from "@tardemah/domain";
import { ApiError } from "@/lib/api";
import type { RequestContext } from "@/lib/session";

export function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "dream-book";
  return base + "-" + randomBytes(3).toString("hex");
}

/** Loads the caller's membership in a specific workspace (not necessarily the active one). */
export async function membershipFor(context: RequestContext, workspaceId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: context.userId, workspaceId } },
    include: { workspace: true },
  });
  if (!membership) throw new ApiError(404, "Dream book not found.");
  return membership as typeof membership & { role: Role };
}

export const inviteTtlMs = 1000 * 60 * 60 * 24 * 14;
