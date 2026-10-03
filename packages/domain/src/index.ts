export * from "./appearance";
export * from "./entry-templates";
export * from "./tenancy";

export type DreamMood =
  | "peaceful"
  | "happy"
  | "curious"
  | "nostalgic"
  | "anxious"
  | "strange"
  | string;

export type DreamVisibility = "PRIVATE" | "WORKSPACE";

export type DreamEntry = {
  id: string;
  clientId?: string | null;
  workspaceId: string;
  authorId: string;
  title: string;
  content: string;
  dreamedAt: Date;
  mood?: DreamMood;
  vividness?: number;
  isLucid: boolean;
  isNightmare: boolean;
  tags: string[];
  visibility: DreamVisibility;
  templateId?: string | null;
};
