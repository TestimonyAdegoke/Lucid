import {
  appearanceDataAttributes,
  appearanceToCssVars,
  isDarkAppearance,
  type Appearance,
  type EntryTemplate,
  type Entitlements,
  type Plan,
  type Role,
} from "@tardemah/domain";
import type { SerializedDream } from "@/lib/dreams";
import type { SerializedPreferences } from "@/lib/preferences";
import type { StyleSummary } from "@/lib/templates";

export type Dream = SerializedDream;
export type Template = EntryTemplate & { createdById?: string };
export type Style = StyleSummary;

export type WorkspaceSummary = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  kind: "PERSONAL" | "PROFESSIONAL";
  plan: Plan;
  role: Role;
  memberCount: number;
  isPersonal: boolean;
};

export type Me = {
  user: { id: string; name: string | null; email: string | null; authenticated: boolean };
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  preferences: SerializedPreferences;
  templates: Template[];
  styles: Style[];
  plan: { plan: Plan; limits: Entitlements; usage: { transcriptions: number } };
  features: { voice: boolean; accounts: boolean };
};

export class ClientError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/** JSON fetch against the Tardemah API that surfaces the server's friendly error message. */
export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(path, {
    cache: "no-store",
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClientError(response.status, payload.error || "Tardemah could not reach your journal.", payload.code);
  }
  return payload as T;
}

const CACHE_KEY = "tardemah.appearance.v1";

/** Applies a journal appearance to the document: CSS custom properties plus data attributes for textures. */
export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  const vars = appearanceToCssVars(appearance);
  const data = appearanceDataAttributes(appearance);

  // Clear free-form overrides (e.g. line spacing) that the new look doesn't set.
  root.style.removeProperty("--body-leading");
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
  for (const [key, value] of Object.entries(data)) root.dataset[key] = value;
  root.style.colorScheme = isDarkAppearance(appearance) ? "dark" : "light";

  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ vars, data }));
  } catch {
    // Storage can be unavailable (private mode); the look is still applied for this visit.
  }
}

/** Inline script for the app layout: paints the cached look before React hydrates, avoiding a theme flash. */
export const appearanceBootScript = `try{var c=JSON.parse(localStorage.getItem("${CACHE_KEY}")||"null");if(c){var r=document.documentElement;for(var k in c.vars)r.style.setProperty(k,c.vars[k]);for(var d in c.data)r.dataset[d]=c.data[d];r.style.colorScheme=c.data.dark==="true"?"dark":"light"}}catch(e){}`;

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Still dreaming";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export function displayDate(value: string, year = true) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    ...(year ? { year: "numeric" as const } : {}),
  }).format(new Date(value));
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "☾";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
