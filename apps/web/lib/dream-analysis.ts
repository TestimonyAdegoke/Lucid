import { db, EntityKind } from "@tardemah/database";
import { fieldValuesToText } from "@tardemah/domain";
import type { DreamFields } from "@/lib/dreams";
import { extractDreamEntities, isOpenAIConfigured, type ExtractedEntity } from "@/lib/openai";

const stopWords = new Set([
  "about","after","again","also","and","because","before","being","but","could","dream","dreamed","from","have",
  "into","just","like","more","myself","that","their","there","these","they","this","through","very","was","were",
  "what","when","where","which","while","with","would","your","you","then","some","something","really","remember",
]);

const surfaceLexicon: Array<[ExtractedEntity["kind"], string[]]> = [
  ["PERSON", ["mother","mum","mom","father","dad","sister","brother","wife","husband","friend","boss","pastor","teacher","baby","child"]],
  ["PLACE", ["home","house","school","church","office","airport","road","street","hotel","hospital","beach","ocean","sea","river","garden","forest","city","room"]],
  ["OBJECT", ["car","phone","book","door","key","train","bus","plane","boat","mirror","clock","bag","shoe","ring","money"]],
  ["SYMBOL", ["water","fire","rain","moon","sun","snake","bird","dog","cat","blood","light","darkness","stairs","bridge"]],
  ["THEME", ["flying","falling","running","chasing","chased","searching","lost","late","exam","travel","wedding","work","death","escape"]],
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9' -]+/g, "").replace(/\s+/g, " ");
}

function fallbackEntities(input: { content: string; tags: string[]; mood: string | null }) {
  const text = normalize(input.content);
  const found = new Map<string, ExtractedEntity>();

  for (const [kind, values] of surfaceLexicon) {
    for (const value of values) {
      const escaped = value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
      if (new RegExp("\\b" + escaped + "\\b", "i").test(text)) {
        found.set(kind + ":" + value, {
          kind,
          label: value,
          normalized: value,
          confidence: 0.62,
        });
      }
    }
  }

  for (const tag of input.tags) {
    const tagValue = normalize(tag);
    if (!tagValue) continue;
    found.set("THEME:" + tagValue, {
      kind: "THEME",
      label: tagValue,
      normalized: tagValue,
      confidence: 0.72,
    });
  }

  if (input.mood) {
    const mood = normalize(input.mood);
    if (mood) {
      found.set("THEME:mood-" + mood, {
        kind: "THEME",
        label: mood + " mood",
        normalized: "mood:" + mood,
        confidence: 0.55,
      });
    }
  }

  return [...found.values()].slice(0, 16);
}

function tokenSet(value: string) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length >= 4 && !stopWords.has(word))
  );
}

function intersection<T>(a: Set<T>, b: Set<T>) {
  return [...a].filter((value) => b.has(value));
}

function jaccard<T>(a: Set<T>, b: Set<T>) {
  if (!a.size || !b.size) return 0;
  const shared = intersection(a, b).length;
  const union = new Set([...a, ...b]).size;
  return union ? shared / union : 0;
}

export type SimilarityDream = {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  entities: string[];
};

export function calculateDreamSimilarity(a: SimilarityDream, b: SimilarityDream) {
  const entitiesA = new Set(a.entities.map(normalize).filter(Boolean));
  const entitiesB = new Set(b.entities.map(normalize).filter(Boolean));
  const tagsA = new Set(a.tags.map(normalize).filter(Boolean));
  const tagsB = new Set(b.tags.map(normalize).filter(Boolean));
  const wordsA = tokenSet(a.title + " " + a.content);
  const wordsB = tokenSet(b.title + " " + b.content);

  const sharedEntities = intersection(entitiesA, entitiesB);
  const sharedTags = intersection(tagsA, tagsB);
  const entityScore = jaccard(entitiesA, entitiesB);
  const tagScore = jaccard(tagsA, tagsB);
  const wordScore = jaccard(wordsA, wordsB);
  const moodScore = a.mood && b.mood && normalize(a.mood) === normalize(b.mood) ? 1 : 0;

  let score = entityScore * 0.46 + tagScore * 0.24 + wordScore * 0.25 + moodScore * 0.05;
  if (sharedEntities.length >= 2) score += 0.08;
  if (sharedTags.length >= 2) score += 0.05;

  return {
    score: Math.min(1, score),
    sharedEntities,
    sharedTags,
  };
}

function canonicalPair(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const;
}

export async function analyzeDreamById(dreamId: string) {
  const dream = await db.dream.findUnique({
    where: { id: dreamId },
    include: {
      dreamTags: { include: { tag: true } },
    },
  });
  if (!dream) return;

  const tags = dream.dreamTags.map((item) => item.tag.name);
  const snapshot = dream.fields as DreamFields | null;
  const fieldText = snapshot?.prompts ? fieldValuesToText(snapshot.prompts, snapshot.values ?? {}) : "";
  const content = fieldText ? dream.content + "\n\n" + fieldText : dream.content;
  let entities = fallbackEntities({ content, tags, mood: dream.mood });
  let model = "tardemah-surface-v1";

  if (isOpenAIConfigured()) {
    try {
      const extracted = await extractDreamEntities({
        title: dream.title,
        content,
        mood: dream.mood,
        tags,
      });
      if (extracted.entities.length) {
        entities = extracted.entities;
        model = extracted.model;
      }
    } catch (error) {
      console.error("Tardemah AI extraction fell back to surface analysis", error);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.dreamEntity.deleteMany({ where: { dreamId: dream.id } });
    if (entities.length) {
      await tx.dreamEntity.createMany({
        data: entities.map((entity) => ({
          dreamId: dream.id,
          kind: EntityKind[entity.kind],
          label: entity.label,
          normalized: entity.normalized,
          confidence: entity.confidence,
        })),
      });
    }

    await tx.dreamInsight.deleteMany({
      where: { dreamId: dream.id, lens: "PERSONAL_PATTERN" },
    });
    await tx.dreamInsight.create({
      data: {
        dreamId: dream.id,
        lens: "PERSONAL_PATTERN",
        model,
        content: JSON.stringify({
          entityCount: entities.length,
          note: "Surface structure only; no meaning or diagnosis inferred.",
        }),
      },
    });
  });

  const others = await db.dream.findMany({
    // Connections stay within one author's pages so shared books never link to someone else's private dreams.
    where: {
      workspaceId: dream.workspaceId,
      authorId: dream.authorId,
      id: { not: dream.id },
    },
    include: {
      dreamTags: { include: { tag: true } },
      entities: true,
    },
    orderBy: { dreamedAt: "desc" },
    take: 120,
  });

  const current: SimilarityDream = {
    id: dream.id,
    title: dream.title,
    content,
    mood: dream.mood,
    tags,
    entities: entities.map((entity) => entity.normalized),
  };

  const scored = others
    .map((other) => {
      const similarity = calculateDreamSimilarity(current, {
        id: other.id,
        title: other.title,
        content: other.content,
        mood: other.mood,
        tags: other.dreamTags.map((item) => item.tag.name),
        entities: other.entities.map((entity) => entity.normalized ?? entity.label),
      });
      return { other, ...similarity };
    })
    .filter((item) => item.score >= 0.14)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  await db.dreamConnection.deleteMany({
    where: {
      OR: [{ fromDreamId: dream.id }, { toDreamId: dream.id }],
    },
  });

  for (const item of scored) {
    const [fromDreamId, toDreamId] = canonicalPair(dream.id, item.other.id);
    await db.dreamConnection.upsert({
      where: {
        fromDreamId_toDreamId: { fromDreamId, toDreamId },
      },
      update: {
        score: item.score,
        sharedEntities: item.sharedEntities,
        sharedTags: item.sharedTags,
      },
      create: {
        workspaceId: dream.workspaceId,
        fromDreamId,
        toDreamId,
        score: item.score,
        sharedEntities: item.sharedEntities,
        sharedTags: item.sharedTags,
      },
    });
  }
}
