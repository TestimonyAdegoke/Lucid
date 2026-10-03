import { NextResponse } from "next/server";
import { db } from "@tardemah/database";
import { route } from "@/lib/api";
import { calculateDreamSimilarity, type SimilarityDream } from "@/lib/dream-analysis";
import { visibleDreamsWhere } from "@/lib/dreams";
import { getRequestContext } from "@/lib/session";

export const runtime = "nodejs";

export const GET = route("dream map", async (request: Request) => {
  const context = await getRequestContext(request);

  const dreams = await db.dream.findMany({
    where: visibleDreamsWhere(context),
    include: {
      dreamTags: { include: { tag: true } },
      entities: true,
    },
    orderBy: { dreamedAt: "desc" },
    take: 50,
  });

  const entityCounts = new Map<string, {
    id: string;
    kind: string;
    label: string;
    normalized: string;
    count: number;
    dreamIds: Set<string>;
  }>();

  for (const dream of dreams) {
    for (const entity of dream.entities) {
      const normalized = entity.normalized ?? entity.label.toLowerCase();
      const key = entity.kind + ":" + normalized;
      const current = entityCounts.get(key) ?? {
        id: "entity:" + key,
        kind: entity.kind,
        label: entity.label,
        normalized,
        count: 0,
        dreamIds: new Set<string>(),
      };
      current.count += 1;
      current.dreamIds.add(dream.id);
      entityCounts.set(key, current);
    }

    for (const item of dream.dreamTags) {
      const normalized = item.tag.name.toLowerCase();
      const key = "TAG:" + normalized;
      const current = entityCounts.get(key) ?? {
        id: "entity:" + key,
        kind: "TAG",
        label: item.tag.name,
        normalized,
        count: 0,
        dreamIds: new Set<string>(),
      };
      current.count += 1;
      current.dreamIds.add(dream.id);
      entityCounts.set(key, current);
    }
  }

  const entities = [...entityCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 28);

  const selectedEntityKeys = new Map(entities.map((entity) => [entity.kind + ":" + entity.normalized, entity.id]));
  const entityEdges: Array<{ from: string; to: string; strength: number; kind: "entity" }> = [];

  for (const dream of dreams) {
    for (const entity of dream.entities) {
      const normalized = entity.normalized ?? entity.label.toLowerCase();
      const entityId = selectedEntityKeys.get(entity.kind + ":" + normalized);
      if (entityId) {
        entityEdges.push({ from: dream.id, to: entityId, strength: entity.confidence ?? 0.65, kind: "entity" });
      }
    }

    for (const item of dream.dreamTags) {
      const entityId = selectedEntityKeys.get("TAG:" + item.tag.name.toLowerCase());
      if (entityId) {
        entityEdges.push({ from: dream.id, to: entityId, strength: 0.75, kind: "entity" });
      }
    }
  }

  const similarityDreams: SimilarityDream[] = dreams.map((dream) => ({
    id: dream.id,
    title: dream.title,
    content: dream.content,
    mood: dream.mood,
    tags: dream.dreamTags.map((item) => item.tag.name),
    entities: dream.entities.map((entity) => entity.normalized ?? entity.label),
  }));

  const connectionEdges: Array<{
    from: string;
    to: string;
    strength: number;
    kind: "connection";
    sharedEntities: string[];
    sharedTags: string[];
  }> = [];

  for (let i = 0; i < similarityDreams.length; i += 1) {
    for (let j = i + 1; j < similarityDreams.length; j += 1) {
      const similarity = calculateDreamSimilarity(similarityDreams[i], similarityDreams[j]);
      if (similarity.score >= 0.16) {
        connectionEdges.push({
          from: similarityDreams[i].id,
          to: similarityDreams[j].id,
          strength: similarity.score,
          kind: "connection",
          sharedEntities: similarity.sharedEntities,
          sharedTags: similarity.sharedTags,
        });
      }
    }
  }

  connectionEdges.sort((a, b) => b.strength - a.strength);

  return NextResponse.json({
    dreams: dreams.map((dream) => ({
      id: dream.id,
      title: dream.title,
      dreamedAt: dream.dreamedAt.toISOString(),
      mood: dream.mood,
      isFavorite: dream.isFavorite,
    })),
    entities: entities.map((entity) => ({
      id: entity.id,
      kind: entity.kind,
      label: entity.label,
      count: entity.count,
      dreamIds: [...entity.dreamIds],
    })),
    edges: [...entityEdges, ...connectionEdges.slice(0, 40)],
  });
});
