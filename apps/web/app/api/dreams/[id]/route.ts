import { db, DreamVisibility, Prisma } from "@tardemah/database";
import { hasRole, sanitizeFieldValues } from "@tardemah/domain";
import { after, NextResponse } from "next/server";
import { ApiError, readJson, requireRole, route } from "@/lib/api";
import {
  buildFields,
  clampScale,
  cleanTags,
  customPrompts,
  dreamInclude,
  parseVisibility,
  serializeDream,
  tagWrites,
  visibleDreamsWhere,
  type DreamFields,
} from "@/lib/dreams";
import { analyzeDreamById } from "@/lib/dream-analysis";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = route("open dream", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  const { id } = await params;

  const dream = await db.dream.findFirst({
    where: { id, ...visibleDreamsWhere(context) },
    include: dreamInclude,
  });
  if (!dream) throw new ApiError(404, "Dream not found.");

  return NextResponse.json({ dream: serializeDream(dream, context.userId) });
});

export const PATCH = route("update dream", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;
  const body = await readJson(request);

  // Only the author may edit a page, even in a shared book.
  const existing = await db.dream.findFirst({
    where: { id, workspaceId: context.workspaceId, authorId: context.userId },
    select: { id: true, fields: true },
  });
  if (!existing) throw new ApiError(404, "Dream not found.");

  const tags = body.tags === undefined ? undefined : cleanTags(body.tags);
  const dreamedAt = body.dreamedAt === undefined ? undefined : new Date(String(body.dreamedAt));
  if (dreamedAt && Number.isNaN(dreamedAt.getTime())) throw new ApiError(400, "The dream date is invalid.");

  let fields: DreamFields | null | undefined;
  const snapshot = existing.fields as DreamFields | null;
  const newPrompts = customPrompts(body.prompts);
  if (newPrompts) {
    // The writer reshaped this page's questions (added, removed or reworded).
    fields = buildFields(null, newPrompts, body.fields ?? snapshot?.values ?? {});
    if (fields && snapshot?.template) fields.template = snapshot.template;
  } else if (body.fields !== undefined && snapshot?.prompts) {
    fields = { ...snapshot, values: sanitizeFieldValues(snapshot.prompts, body.fields) };
  }

  const isShared = context.workspaceId !== context.personalWorkspaceId;

  const dream = await db.dream.update({
    where: { id },
    data: {
      title: typeof body.title === "string" ? body.title.trim().slice(0, 180) || "Untitled dream" : undefined,
      content: typeof body.content === "string" && body.content.trim() ? body.content.trim().slice(0, 50_000) : undefined,
      dreamedAt,
      mood: typeof body.mood === "string" ? body.mood.slice(0, 50) : undefined,
      vividness: clampScale(body.vividness),
      sleepQuality: clampScale(body.sleepQuality),
      isLucid: typeof body.isLucid === "boolean" ? body.isLucid : undefined,
      isNightmare: typeof body.isNightmare === "boolean" ? body.isNightmare : undefined,
      isFavorite: typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
      visibility: isShared ? parseVisibility(body.visibility) : DreamVisibility.PRIVATE,
      fields: fields === null ? Prisma.DbNull : fields,
      dreamTags: tags === undefined ? undefined : { deleteMany: {}, create: tagWrites(context.workspaceId, tags) },
    },
    include: dreamInclude,
  });

  const shouldReanalyze = ["title", "content", "mood", "tags", "fields", "prompts"].some((key) => body[key] !== undefined);
  if (shouldReanalyze) {
    after(async () => {
      try {
        await analyzeDreamById(dream.id);
      } catch (error) {
        console.error("Post-edit dream analysis failed", error);
      }
    });
  }

  return NextResponse.json({ dream: serializeDream(dream, context.userId) });
});

export const DELETE = route("delete dream", async (request: Request, { params }: RouteContext) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const { id } = await params;

  // Authors can always remove their own pages; owners/admins can remove pages shared into their book.
  const result = await db.dream.deleteMany({
    where: {
      id,
      workspaceId: context.workspaceId,
      OR: [
        { authorId: context.userId },
        ...(hasRole(context.role, "ADMIN") ? [{ visibility: DreamVisibility.WORKSPACE }] : []),
      ],
    },
  });

  if (!result.count) throw new ApiError(404, "Dream not found.");
  return new Response(null, { status: 204 });
});
