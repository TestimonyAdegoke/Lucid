import { db, DreamSource, DreamVisibility } from "@tardemah/database";
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
} from "@/lib/dreams";
import { analyzeDreamById } from "@/lib/dream-analysis";
import { getRequestContext } from "@/lib/session";
import { findEntryTemplate } from "@/lib/templates";

export const runtime = "nodejs";

export const GET = route("list dreams", async (request: Request) => {
  const context = await getRequestContext(request);
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120);

  const dreams = await db.dream.findMany({
    where: {
      ...visibleDreamsWhere(context),
      ...(query
        ? {
            AND: [{
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { content: { contains: query, mode: "insensitive" } },
                { dreamTags: { some: { tag: { name: { contains: query.toLowerCase() } } } } },
              ],
            }],
          }
        : {}),
    },
    include: dreamInclude,
    orderBy: [{ dreamedAt: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({ dreams: dreams.map((dream) => serializeDream(dream, context.userId)) });
});

export const POST = route("create dream", async (request: Request) => {
  const context = await getRequestContext(request);
  requireRole(context, "MEMBER");
  const body = await readJson(request);

  if (typeof body.content !== "string" || !body.content.trim()) {
    throw new ApiError(400, "A dream needs at least a small fragment.");
  }
  if (body.content.length > 50_000) throw new ApiError(400, "This dream entry is too long.");

  const clientId =
    typeof body.clientId === "string" && body.clientId.length >= 8 && body.clientId.length <= 128
      ? body.clientId
      : null;

  if (clientId) {
    // Idempotent retries (e.g. offline mobile sync) return the original page instead of duplicating it.
    const existing = await db.dream.findUnique({
      where: { authorId_clientId: { authorId: context.userId, clientId } },
      include: dreamInclude,
    });
    if (existing) return NextResponse.json({ dream: serializeDream(existing, context.userId) });
  }

  const dreamedAt = body.dreamedAt ? new Date(String(body.dreamedAt)) : new Date();
  if (Number.isNaN(dreamedAt.getTime())) throw new ApiError(400, "The dream date is invalid.");

  const templateId = typeof body.templateId === "string" ? body.templateId : null;
  const template = templateId ? await findEntryTemplate(context.workspaceId, templateId) : null;
  if (templateId && !template) throw new ApiError(400, "That entry template is no longer available.");

  // Clients that show tags send the final list; otherwise the template's default tags apply.
  const tags = cleanTags(Array.isArray(body.tags) ? body.tags : template?.defaults.tags ?? []);
  const prompts = customPrompts(body.prompts) ?? template?.prompts ?? [];
  const fields = buildFields(template, prompts, body.fields);
  const isShared = context.workspaceId !== context.personalWorkspaceId;

  const dream = await db.dream.create({
    data: {
      clientId,
      workspaceId: context.workspaceId,
      authorId: context.userId,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 180) : "Untitled dream",
      content: body.content.trim(),
      dreamedAt,
      mood: typeof body.mood === "string" ? body.mood.slice(0, 50) : template?.defaults.mood ?? null,
      vividness: clampScale(body.vividness) ?? null,
      sleepQuality: clampScale(body.sleepQuality) ?? null,
      isLucid: typeof body.isLucid === "boolean" ? body.isLucid : Boolean(template?.defaults.isLucid),
      isNightmare: typeof body.isNightmare === "boolean" ? body.isNightmare : Boolean(template?.defaults.isNightmare),
      isFavorite: body.isFavorite === true,
      // Pages in a shared book stay private to the author unless they explicitly choose to share.
      visibility: isShared ? parseVisibility(body.visibility) ?? DreamVisibility.PRIVATE : DreamVisibility.PRIVATE,
      templateKey: template?.id ?? null,
      customTemplateId: template && !template.system ? template.id : null,
      fields: fields ?? undefined,
      source: context.client === "mobile" ? DreamSource.MOBILE : DreamSource.WEB,
      dreamTags: tags.length ? { create: tagWrites(context.workspaceId, tags) } : undefined,
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

  return NextResponse.json({ dream: serializeDream(dream, context.userId) }, { status: 201 });
});
