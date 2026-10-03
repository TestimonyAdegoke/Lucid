import AsyncStorage from "@react-native-async-storage/async-storage";

export type SyncStatus = "synced" | "pending-create" | "pending-update";

export type MobileDream = {
  id: string;
  clientId: string;
  title: string;
  body: string;
  dreamedAt: string;
  mood: string;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
  syncStatus: SyncStatus;
};

// Storage key predates the rename to Tardemah; kept so offline dreams on existing installs are not lost.
const DREAMS_KEY = "lucid.mobile.dreams";

function normalizeDream(input: Partial<MobileDream> & { id?: string }): MobileDream | null {
  if (!input.id || typeof input.title !== "string" || typeof input.body !== "string") return null;

  const legacyStatus = input.syncStatus as string | undefined;
  const syncStatus: SyncStatus =
    legacyStatus === "pending"
      ? "pending-create"
      : legacyStatus === "pending-create" || legacyStatus === "pending-update"
        ? legacyStatus
        : "synced";

  return {
    id: input.id,
    clientId: input.clientId ?? input.id,
    title: input.title,
    body: input.body,
    dreamedAt: input.dreamedAt ?? new Date().toISOString(),
    mood: input.mood ?? "unspoken",
    tags: Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === "string") : [],
    vividness: typeof input.vividness === "number" ? input.vividness : null,
    isLucid: Boolean(input.isLucid),
    isNightmare: Boolean(input.isNightmare),
    isFavorite: Boolean(input.isFavorite),
    syncStatus,
  };
}

export async function loadCachedDreams(): Promise<MobileDream[]> {
  const raw = await AsyncStorage.getItem(DREAMS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Partial<MobileDream> & { id?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDream).filter((dream): dream is MobileDream => Boolean(dream));
  } catch {
    return [];
  }
}

export async function saveCachedDreams(dreams: MobileDream[]) {
  await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(dreams));
}

export async function upsertCachedDream(dream: MobileDream) {
  const current = await loadCachedDreams();
  const next = [dream, ...current.filter((item) => item.clientId !== dream.clientId)];
  await saveCachedDreams(next);
  return next;
}

export async function findCachedDream(clientId: string) {
  const current = await loadCachedDreams();
  return current.find((item) => item.clientId === clientId) ?? null;
}

export async function removeCachedDream(clientId: string) {
  const current = await loadCachedDreams();
  const next = current.filter((item) => item.clientId !== clientId);
  await saveCachedDreams(next);
  return next;
}
