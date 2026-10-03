import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const SESSION_KEY = "lucid.mobile.session";

type ApiDream = {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string | null;
};

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (!value) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  }
  return value;
}

async function sessionToken() {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const token = [Crypto.randomUUID(), Crypto.randomUUID(), Crypto.randomUUID()].join(".");
  await AsyncStorage.setItem(SESSION_KEY, token);
  return token;
}

async function lucidFetch(path: string, init?: RequestInit) {
  const token = await sessionToken();

  return fetch(apiBaseUrl() + path, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-lucid-client": "mobile",
      "x-lucid-session": token,
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchRemoteDreams() {
  const response = await lucidFetch("/api/dreams");
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
}) {
  const response = await lucidFetch("/api/dreams", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error("Unable to save dream remotely.");

  const payload = (await response.json()) as { dream: ApiDream };
  return payload.dream;
}
