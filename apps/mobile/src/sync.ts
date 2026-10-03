import * as Crypto from "expo-crypto";
import { ApiDream, createRemoteDream, deleteRemoteDream, fetchRemoteDreams, updateRemoteDream } from "./api";
import {
  findCachedDream,
  loadCachedDreams,
  MobileDream,
  removeCachedDream,
  saveCachedDreams,
  upsertCachedDream,
} from "./storage";

function fromRemote(dream: ApiDream): MobileDream {
  return {
    id: dream.id,
    clientId: dream.clientId ?? dream.id,
    title: dream.title,
    body: dream.content,
    dreamedAt: dream.dreamedAt,
    mood: dream.mood ?? "unspoken",
    tags: dream.tags,
    vividness: dream.vividness,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
    syncStatus: "synced",
  };
}

function remotePayload(dream: MobileDream) {
  return {
    title: dream.title,
    content: dream.body,
    dreamedAt: dream.dreamedAt,
    mood: dream.mood,
    tags: dream.tags,
    vividness: dream.vividness,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
  };
}

async function flushPending(dreams: MobileDream[]) {
  let current = dreams;

  for (const dream of dreams.filter((item) => item.syncStatus !== "synced")) {
    try {
      const remote =
        dream.syncStatus === "pending-create"
          ? await createRemoteDream({ clientId: dream.clientId, ...remotePayload(dream) })
          : await updateRemoteDream(dream.id, remotePayload(dream));

      const synced = fromRemote(remote);
      current = [synced, ...current.filter((item) => item.clientId !== dream.clientId)];
      await saveCachedDreams(current);
    } catch {
      // Keep the local mutation queued for the next refresh.
    }
  }

  return current;
}

export async function refreshDreams() {
  const cached = await loadCachedDreams();
  const afterFlush = await flushPending(cached);

  try {
    const remote = await fetchRemoteDreams();
    const pending = afterFlush.filter((item) => item.syncStatus !== "synced");
    const remoteDreams = remote.map(fromRemote);
    const pendingClientIds = new Set(pending.map((item) => item.clientId));
    const merged = [
      ...pending,
      ...remoteDreams.filter((item) => !pendingClientIds.has(item.clientId)),
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
    tags: [],
    vividness: null,
    isLucid: false,
    isNightmare: false,
    isFavorite: false,
    syncStatus: "pending-create",
  };

  await upsertCachedDream(local);

  try {
    const remote = await createRemoteDream({ clientId, ...remotePayload(local) });
    const synced = fromRemote(remote);
    await upsertCachedDream(synced);
    return synced;
  } catch {
    return local;
  }
}

export async function updateDream(clientId: string, input: Partial<{
  title: string;
  body: string;
  mood: string;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
}>) {
  const existing = await findCachedDream(clientId);
  if (!existing) throw new Error("Dream not found.");

  const local: MobileDream = {
    ...existing,
    ...input,
    syncStatus: existing.syncStatus === "pending-create" ? "pending-create" : "pending-update",
  };

  await upsertCachedDream(local);

  if (local.syncStatus === "pending-create") return local;

  try {
    const remote = await updateRemoteDream(local.id, remotePayload(local));
    const synced = fromRemote(remote);
    await upsertCachedDream(synced);
    return synced;
  } catch {
    return local;
  }
}

export async function deleteDream(clientId: string) {
  const existing = await findCachedDream(clientId);
  if (!existing) return;

  if (existing.syncStatus === "pending-create") {
    await removeCachedDream(clientId);
    return;
  }

  await deleteRemoteDream(existing.id);
  await removeCachedDream(clientId);
}
