export type DreamMood = "peaceful" | "happy" | "curious" | "nostalgic" | "anxious" | "strange" | string;

export type DreamEntry = {
  id: string;
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
};

export type JournalTheme = "lavender" | "rose" | "sage" | "midnight";

export type JournalPreferences = {
  theme: JournalTheme;
  displayName?: string;
  promptStyle: "gentle" | "minimal" | "reflective";
  pageDensity: "airy" | "balanced" | "compact";
};
