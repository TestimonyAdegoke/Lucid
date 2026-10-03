import { db } from "@lucid/database";
import { after, NextResponse } from "next/server";
import { cleanTags, serializeDream } from "@/lib/dreams";
import { analyzeDreamById } from "@/lib/dream-analysis";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

const dreamInclude = {
  dreamTags: {
    include: {
      tag: true,
    },
  },
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const context = await getRequestContext(request);
  const { id } = await params;

  const dream = await db.dream.findFirst({
    where: {
      id,
      workspaceId: context.workspaceId,
    },
    include: dreamInclude,
  });

  if (!dream) {
    return NextResponse.json({ error: "Dream not found." }, { status: 404 });
  }

  return NextResponse.json({ dream: serializeDream(dream) });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const context = await getRequestContext(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await db.dream.findFirst({
      where: {
        id,
        workspaceId: context.workspaceId,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Dream not found." }, { status: 404 });
    }

    const tags = body.tags === undefined ? undefined : cleanTags(body.tags);
    const dreamedAt = body.dreamedAt === undefined ? undefined : new Date(body.dreamedAt);

    if (dreamedAt && Number.isNaN(dreamedAt.getTime())) {
      return NextResponse.json({ error: "The dream date is invalid." }, { status: 400 });
    }

    const dream = await db.dream.update({
      where: { id },
      data: {
        title:
          typeof body.title === "string"
            ? body.title.trim().slice(0, 180) || "Untitled dream"
            : undefined,
        content:
          typeof body.content === "string" && body.content.trim()
            ? body.content.trim().slice(0, 50_000)
            : undefined,
        dreamedAt,
        mood: typeof body.mood === "string" ? body.mood.slice(0, 50) : undefined,
        vividness: Number.isInteger(body.vividness) ? Math.max(1, Math.min(10, body.vividness)) : undefined,
        sleepQuality: Number.isInteger(body.sleepQuality) ? Math.max(1, Math.min(10, body.sleepQuality)) : undefined,
        isLucid: typeof body.isLucid === "boolean" ? body.isLucid : undefined,
        isNightmare: typeof body.isNightmare === "boolean" ? body.isNightmare : undefined,
        isFavorite: typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
        dreamTags:
          tags === undefined
            ? undefined
            : {
                deleteMany: {},
                create: tags.map((name) => ({
                  tag: {
                    connectOrCreate: {
                      where: {
                        workspaceId_name: {
                          workspaceId: context.workspaceId,
                          name,
                        },
                      },
                      create: {
                        workspaceId: context.workspaceId,
                        name,
                      },
                    },
                  },
                })),
              },
      },
      include: dreamInclude,
    });

    const shouldReanalyze =
      body.title !== undefined ||
      body.content !== undefined ||
      body.mood !== undefined ||
      body.tags !== undefined;

    if (shouldReanalyze) {
      after(async () => {
        try {
          await analyzeDreamById(dream.id);
        } catch (error) {
          console.error("Post-edit dream analysis failed", error);
        }
      });
    }

    return NextResponse.json({ dream: serializeDream(dream) });
  } catch (error) {
    console.error("Failed to update dream", error);
    return NextResponse.json({ error: "Lucid could not update this dream." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const context = await getRequestContext(request);
    const { id } = await params;

    const result = await db.dream.deleteMany({
      where: {
        id,
        workspaceId: context.workspaceId,
      },
    });

    if (!result.count) {
      return NextResponse.json({ error: "Dream not found." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete dream", error);
    return NextResponse.json({ error: "Lucid could not delete this dream." }, { status: 500 });
  }
}
