import { db } from "@tardemah/database";
import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { isAuthConfigured } from "@/lib/auth/server";
import { monthlyUsage, workspaceEntitlements } from "@/lib/entitlements";
import { isOpenAIConfigured } from "@/lib/openai";
import { loadPreferences } from "@/lib/preferences";
import { getRequestContext } from "@/lib/session";
import { listEntryTemplates, listJournalStyles } from "@/lib/templates";

export const runtime = "nodejs";

/** One bootstrap call for the journal: identity, active dream book, all books, look, templates and plan. */
export const GET = route("load me", async (request: Request) => {
  const context = await getRequestContext(request);

  const [user, memberships, preferences, templates, styles, entitlements, transcriptions] = await Promise.all([
    db.user.findUnique({ where: { id: context.userId }, select: { id: true, name: true, email: true } }),
    db.membership.findMany({
      where: { userId: context.userId },
      include: { workspace: { include: { _count: { select: { memberships: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    loadPreferences(context),
    listEntryTemplates(context.workspaceId),
    listJournalStyles(context.workspaceId),
    workspaceEntitlements(context.workspaceId),
    monthlyUsage(context.workspaceId, "transcription"),
  ]);

  const workspaces = memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    emoji: membership.workspace.emoji,
    description: membership.workspace.description,
    kind: membership.workspace.kind,
    plan: membership.workspace.plan,
    role: membership.role,
    memberCount: membership.workspace._count.memberships,
    isPersonal: membership.workspace.id === context.personalWorkspaceId,
  }));

  return NextResponse.json({
    user: {
      id: context.userId,
      name: preferences.displayName || user?.name || null,
      email: user?.email ?? null,
      authenticated: context.authenticated,
    },
    workspace: workspaces.find((workspace) => workspace.id === context.workspaceId),
    workspaces,
    preferences,
    templates,
    styles,
    plan: {
      plan: entitlements.plan,
      limits: entitlements.limits,
      usage: { transcriptions },
    },
    features: { voice: isOpenAIConfigured(), accounts: isAuthConfigured() },
  });
});
