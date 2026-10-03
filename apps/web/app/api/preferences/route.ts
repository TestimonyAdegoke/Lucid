import { db } from "@lucid/database";
import { NextResponse } from "next/server";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

const allowedThemes = new Set(["lavender", "rose", "sage", "midnight"]);
const allowedPromptStyles = new Set(["gentle", "minimal", "reflective"]);
const allowedDensities = new Set(["airy", "balanced", "compact"]);

export async function GET(request: Request) {
  const context = await getRequestContext(request);

  const preferences = await db.journalPreference.upsert({
    where: {
      userId_workspaceId: {
        userId: context.userId,
        workspaceId: context.workspaceId,
      },
    },
    update: {},
    create: {
      userId: context.userId,
      workspaceId: context.workspaceId,
    },
  });

  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const context = await getRequestContext(request);
  const body = await request.json();

  const data = {
    theme: allowedThemes.has(body.theme) ? body.theme : undefined,
    cover: typeof body.cover === "string" ? body.cover.slice(0, 60) : undefined,
    typography: typeof body.typography === "string" ? body.typography.slice(0, 60) : undefined,
    promptStyle: allowedPromptStyles.has(body.promptStyle) ? body.promptStyle : undefined,
    pageDensity: allowedDensities.has(body.pageDensity) ? body.pageDensity : undefined,
  };

  const preferences = await db.journalPreference.upsert({
    where: {
      userId_workspaceId: {
        userId: context.userId,
        workspaceId: context.workspaceId,
      },
    },
    update: data,
    create: {
      userId: context.userId,
      workspaceId: context.workspaceId,
      ...data,
    },
  });

  return NextResponse.json({ preferences });
}
