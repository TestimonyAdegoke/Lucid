import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// Storage key predates the rename to Tardemah; kept so existing installs keep their device session.
const SESSION_KEY = "lucid.mobile.session";

export type ApiDream = {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string | null;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
};

export type DreamGraphData = {
  dreams: Array<{
    id: string;
    title: string;
    dreamedAt: string;
    mood: string | null;
    isFavorite: boolean;
  }>;
  entities: Array<{
    id: string;
    kind: string;
    label: string;
    count: number;
    dreamIds: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    strength: number;
    kind: "entity" | "connection";
    sharedEntities?: string[];
    sharedTags?: string[];
  }>;
};

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!value) throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  return value;
}

async function sessionToken() {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const token = [Crypto.randomUUID(), Crypto.randomUUID(), Crypto.randomUUID()].join(".");
  await AsyncStorage.setItem(SESSION_KEY, token);
  return token;
}

async function mobileHeaders(includeJson = true) {
  const token = await sessionToken();
  return {
    Accept: "application/json",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    "x-tardemah-client": "mobile",
    "x-tardemah-session": token,
  };
}

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiBaseUrl() + path, {
    ...init,
    headers: {
      ...(await mobileHeaders(true)),
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchRemoteDreams() {
  const response = await apiFetch("/api/dreams");
  if (!response.ok) throw new Error("Unable to sync dreams.");
  const payload = (await response.json()) as { dreams: ApiDream[] };
  return payload.dreams;
}

export async function createRemoteDream(input: {
  clientId: string;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string;
  tags?: string[];
  vividness?: number | null;
  isLucid?: boolean;
  isNightmare?: boolean;
  isFavorite?: boolean;
}) {
  const response = await apiFetch("/api/dreams", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Unable to save dream remotely.");
  const payload = (await response.json()) as { dream: ApiDream };
  return payload.dream;
}

export async function updateRemoteDream(id: string, input: Partial<{
  title: string;
  content: string;
  dreamedAt: string;
  mood: string;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
}>) {
  const response = await apiFetch("/api/dreams/" + encodeURIComponent(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Unable to update dream remotely.");
  const payload = (await response.json()) as { dream: ApiDream };
  return payload.dream;
}

export async function deleteRemoteDream(id: string) {
  const response = await apiFetch("/api/dreams/" + encodeURIComponent(id), { method: "DELETE" });
  if (!response.ok) throw new Error("Unable to delete dream remotely.");
}

export async function transcribeRemoteAudio(uri: string) {
  const form = new FormData();
  form.append(
    "audio",
    {
      uri,
      name: "dream.m4a",
      type: "audio/mp4",
    } as unknown as Blob,
  );

  const response = await fetch(apiBaseUrl() + "/api/transcribe", {
    method: "POST",
    headers: await mobileHeaders(false),
    body: form,
  });

  const payload = await response.json().catch(() => ({})) as { transcript?: string; error?: string };
  if (!response.ok || !payload.transcript) {
    throw new Error(payload.error || "Tardemah could not transcribe that recording.");
  }

  return payload.transcript;
}

export async function fetchDreamGraph() {
  const response = await apiFetch("/api/graph");
  if (!response.ok) throw new Error("Unable to open your Dream Map.");
  return await response.json() as DreamGraphData;
}
