import AsyncStorage from "@react-native-async-storage/async-storage";

export type MobileDream = {
  id: string;
  title: string;
  body: string;
  date: string;
  mood: string;
};

const KEY = "lucid.mobile.dreams";

export const starterDreams: MobileDream[] = [
  {
    id: "moonlit-train",
    title: "The moonlit train",
    body: "Every window showed a different season. I remember feeling strangely peaceful.",
    date: "Oct 3",
    mood: "peaceful",
  },
  {
    id: "blue-house",
    title: "The little blue house",
    body: "Someone had left the porch light on for me.",
    date: "Sep 29",
    mood: "nostalgic",
  },
];

export async function getDreams() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return starterDreams;

  try {
    const parsed = JSON.parse(raw) as MobileDream[];
    return Array.isArray(parsed) ? parsed : starterDreams;
  } catch {
    return starterDreams;
  }
}

export async function saveDream(dream: MobileDream) {
  const current = await getDreams();
  const next = [dream, ...current];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
