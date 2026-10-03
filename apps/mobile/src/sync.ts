import * as Crypto from "expo-crypto";
import { createRemoteDream, fetchRemoteDreams } from "./api";
import {
  loadCachedDreams,
  MobileDream,
  saveCachedDreams,
  upsertCachedDream,
} from "./storage";

function fromRemote(dream: {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string | null;
}): MobileDream {
  return {
    id: dream.id,
    clientId: dream.clientId ?? dream.id,
    title: dream.title,
    body: dream.content,
    dreamedAt: dream.dreamedAt,
    mood: dream.mood ?? "unspoken",
    syncStatus: "synced",
  };
}

async function flushPending(dreams: MobileDream[]) {
  let current = dreams;

  for (const dream of dreams.filter((item) => item.syncStatus === "pending")) {
    try {
      const remote = await createRemoteDream({
        clientId: dream.clientId,
        title: dream.title,
        content: dream.body,
        dreamedAt: dream.dreamedAt,
        mood: dream.mood,
      });

      const synced = fromRemote(remote);
      current = [synced, ...current.filter((item) => item.clientId !== dream.clientId)];
      await saveCachedDreams(current);
    } catch {
      // Remain pending. A later refresh will retry idempotently by clientId.
    }
  }

  return current;
}

export async function refreshDreams() {
  const cached = await loadCachedDreams();
  const afterFlush = await flushPending(cached);

  try {
    const remote = await fetchRemoteDreams();
    const pending = afterFlush.filter((item) => item.syncStatus === "pending");
    const remoteDreams = remote.map(fromRemote);
    const remoteClientIds = new Set(remoteDreams.map((item) => item.clientId));
    const merged = [
      ...pending.filter((item) => !remoteClientIds.has(item.clientId)),
      ...remoteDreams,
    ];

    await saveCachedDreams(merged);
    return merged;
  } catch {
    return afterFlush;
  }
}

export async function createDream(input: {
  title: string;
  body: string;
  mood: string;
}) {
  const clientId = Crypto.randomUUID();
  const local: MobileDream = {
    id: clientId,
    clientId,
    title: input.title.trim() || "Untitled dream",
    body: input.body.trim(),
    dreamedAt: new Date().toISOString(),
    mood: input.mood,
    syncStatus: "pending",
  };

  await upsertCachedDream(local);

  try {
    const remote = await createRemoteDream({
      clientId,
      title: local.title,
      content: local.body,
      dreamedAt: local.dreamedAt,
      mood: local.mood,
    });

    const synced = fromRemote(remote);
    await upsertCachedDream(synced);
    return synced;
  } catch {
    return local;
  }
}
