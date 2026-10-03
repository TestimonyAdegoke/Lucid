import { db, MembershipRole, WorkspaceKind } from "@tardemah/database";
import { journalStyles } from "@tardemah/domain";
import { NextResponse } from "next/server";
import { ApiError, readJson, route, text } from "@/lib/api";
import { workspaceEntitlements } from "@/lib/entitlements";
import { getRequestContext } from "@/lib/session";
import { slugify } from "@/lib/workspaces";

export const runtime = "nodejs";

export const GET = route("list workspaces", async (request: Request) => {
  const context = await getRequestContext(request);
  const memberships = await db.membership.findMany({
    where: { userId: context.userId },
    include: { workspace: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    activeWorkspaceId: context.workspaceId,
    workspaces: memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      emoji: membership.workspace.emoji,
      description: membership.workspace.description,
      kind: membership.workspace.kind,
      plan: membership.workspace.plan,
      role: membership.role,
      memberCount: membership.workspace._count.memberships,
      isPersonal: membership.workspace.id === context.personalWorkspaceId,
    })),
  });
});

/** Creates a shared dream book (a dream circle, a study group, a practitioner's practice). */
export const POST = route("create workspace", async (request: Request) => {
  const context = await getRequestContext(request);
  const body = await readJson(request);

  const name = text(body.name, 60);
  if (!name) throw new ApiError(400, "Give the shared dream book a name.");

  // Shared-book allowance comes from the creator's personal plan.
  const { limits } = await workspaceEntitlements(context.personalWorkspaceId);
  const owned = await db.membership.count({
    where: { userId: context.userId, role: MembershipRole.OWNER, workspace: { kind: WorkspaceKind.PROFESSIONAL } },
  });
  if (owned >= limits.ownedSharedWorkspaces) {
    throw new ApiError(402, "You have reached the number of shared dream books on your plan.", "limit");
  }

  const workspace = await db.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        name,
        slug: slugify(name),
        description: text(body.description, 240) || null,
        emoji: text(body.emoji, 4) || "✧",
        kind: WorkspaceKind.PROFESSIONAL,
      },
    });
    await tx.membership.create({ data: { userId: context.userId, workspaceId: created.id, role: MembershipRole.OWNER } });

    // Start the new book with the same look the creator already uses.
    const current = await tx.journalPreference.findUnique({
      where: { userId_workspaceId: { userId: context.userId, workspaceId: context.workspaceId } },
    });
    await tx.journalPreference.create({
      data: {
        userId: context.userId,
        workspaceId: created.id,
        ...(current && {
          theme: current.theme,
          cover: current.cover,
          typography: current.typography,
          promptStyle: current.promptStyle,
          pageDensity: current.pageDensity,
          paper: current.paper,
          accentColor: current.accentColor,
          showOrnaments: current.showOrnaments,
          // Saved styles belong to the old book, so only built-in style names carry over.
          styleKey: journalStyles.some((style) => style.key === current.styleKey) ? current.styleKey : "custom",
          displayName: current.displayName,
          design: current.design ?? {},
        }),
      },
    });
    return created;
  });

  return NextResponse.json({ workspace: { ...workspace, role: "OWNER", memberCount: 1, isPersonal: false } }, { status: 201 });
});
