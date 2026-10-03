type DreamWithTags = {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: Date;
  mood: string | null;
  vividness: number | null;
  sleepQuality: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  dreamTags: Array<{ tag: { name: string } }>;
};

export function serializeDream(dream: DreamWithTags) {
  return {
    id: dream.id,
    clientId: dream.clientId,
    title: dream.title,
    content: dream.content,
    dreamedAt: dream.dreamedAt.toISOString(),
    mood: dream.mood,
    vividness: dream.vividness,
    sleepQuality: dream.sleepQuality,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
    source: dream.source,
    tags: dream.dreamTags.map((item) => item.tag.name),
    createdAt: dream.createdAt.toISOString(),
    updatedAt: dream.updatedAt.toISOString(),
  };
}

export function cleanTags(input: unknown) {
  if (!Array.isArray(input)) return [];

  return [...new Set(
    input
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 20),
  )];
}
