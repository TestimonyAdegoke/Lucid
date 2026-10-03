import { db, DreamSource } from "@lucid/database";
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

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request);

    const dreams = await db.dream.findMany({
      where: { workspaceId: context.workspaceId },
      include: dreamInclude,
      orderBy: [{ dreamedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    });

    return NextResponse.json({
      dreams: dreams.map(serializeDream),
    });
  } catch (error) {
    console.error("Failed to load dreams", error);
    return NextResponse.json({ error: "Unable to open your dream book." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getRequestContext(request);
    const body = await request.json();

    if (typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "A dream needs at least a small fragment." }, { status: 400 });
    }

    if (body.content.length > 50_000) {
      return NextResponse.json({ error: "This dream entry is too long." }, { status: 400 });
    }

    const clientId =
      typeof body.clientId === "string" && body.clientId.length >= 8 && body.clientId.length <= 128
        ? body.clientId
        : null;

    if (clientId) {
      const existing = await db.dream.findUnique({
        where: { clientId },
        include: dreamInclude,
      });

      if (existing) {
        if (existing.workspaceId !== context.workspaceId) {
          return NextResponse.json({ error: "That dream identifier is already in use." }, { status: 409 });
        }

        return NextResponse.json({ dream: serializeDream(existing) });
      }
    }

    const tags = cleanTags(body.tags);
    const dreamedAt = body.dreamedAt ? new Date(body.dreamedAt) : new Date();

    if (Number.isNaN(dreamedAt.getTime())) {
      return NextResponse.json({ error: "The dream date is invalid." }, { status: 400 });
    }

    const dream = await db.dream.create({
      data: {
        clientId,
        workspaceId: context.workspaceId,
        authorId: context.userId,
        title:
          typeof body.title === "string" && body.title.trim()
            ? body.title.trim().slice(0, 180)
            : "Untitled dream",
        content: body.content.trim(),
        dreamedAt,
        mood: typeof body.mood === "string" ? body.mood.slice(0, 50) : null,
        vividness: Number.isInteger(body.vividness) ? Math.max(1, Math.min(10, body.vividness)) : null,
        sleepQuality: Number.isInteger(body.sleepQuality) ? Math.max(1, Math.min(10, body.sleepQuality)) : null,
        isLucid: Boolean(body.isLucid),
        isNightmare: Boolean(body.isNightmare),
        source: context.client === "mobile" ? DreamSource.MOBILE : DreamSource.WEB,
        dreamTags: tags.length
          ? {
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
            }
          : undefined,
      },
      include: dreamInclude,
    });

    after(async () => {
      try {
        await analyzeDreamById(dream.id);
      } catch (error) {
        console.error("Post-save dream analysis failed", error);
      }
    });

    return NextResponse.json({ dream: serializeDream(dream) }, { status: 201 });
  } catch (error) {
    console.error("Failed to save dream", error);
    return NextResponse.json({ error: "Lucid could not save this dream." }, { status: 500 });
  }
}
