import AsyncStorage from "@react-native-async-storage/async-storage";

export type MobileDream = {
  id: string;
  clientId: string;
  title: string;
  body: string;
  dreamedAt: string;
  mood: string;
  syncStatus: "synced" | "pending";
};

const DREAMS_KEY = "lucid.mobile.dreams";

export async function loadCachedDreams(): Promise<MobileDream[]> {
  const raw = await AsyncStorage.getItem(DREAMS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as MobileDream[];
    return Array.isArray(parsed) ? parsed : [];
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
