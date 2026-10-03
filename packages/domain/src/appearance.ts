/**
 * The journal appearance catalog. Shared by the API (validation) and the clients (rendering),
 * so a style saved on one device renders identically everywhere.
 */

export type PaletteTokens = {
  ink: string;
  muted: string;
  paper: string;
  paperDeep: string;
  accent: string;
  accentSoft: string;
  accentDark: string;
  cover: string;
  coverDeep: string;
  line: string;
  shadow: string;
  backdrop: string;
  glow: string;
};

export type Palette = {
  id: string;
  name: string;
  note: string;
  dark: boolean;
  tokens: PaletteTokens;
};

export const palettes: Palette[] = [
  {
    id: "lavender", name: "Lavender dusk", note: "soft & dreamy", dark: false,
    tokens: { ink: "#352f39", muted: "#7d7380", paper: "#fffaf3", paperDeep: "#f6eee5", accent: "#8f78b8", accentSoft: "#ebe2f6", accentDark: "#5f4a7c", cover: "#bdaed8", coverDeep: "#8e79ad", line: "rgba(88,69,91,.12)", shadow: "rgba(62,44,67,.18)", backdrop: "#efe9e4", glow: "#f8d8c7" },
  },
  {
    id: "rose", name: "Pressed rose", note: "warm & romantic", dark: false,
    tokens: { ink: "#3b2f31", muted: "#857175", paper: "#fff9f5", paperDeep: "#f8ebe6", accent: "#c37f8b", accentSoft: "#f7e0e3", accentDark: "#8e5059", cover: "#d7a1aa", coverDeep: "#b36f7c", line: "rgba(110,60,70,.12)", shadow: "rgba(80,40,48,.18)", backdrop: "#f3e9e6", glow: "#f5d3c4" },
  },
  {
    id: "sage", name: "Quiet garden", note: "earthy & calm", dark: false,
    tokens: { ink: "#2f3530", muted: "#717a72", paper: "#fbfaf2", paperDeep: "#eef0e4", accent: "#789786", accentSoft: "#deebe0", accentDark: "#4a6957", cover: "#9bb49f", coverDeep: "#6f8a74", line: "rgba(60,80,62,.12)", shadow: "rgba(40,55,42,.18)", backdrop: "#e9ece3", glow: "#f1e3c2" },
  },
  {
    id: "tidepool", name: "Tidepool", note: "cool & clear", dark: false,
    tokens: { ink: "#283340", muted: "#6c7886", paper: "#f9fbfc", paperDeep: "#eaf0f3", accent: "#4f86a8", accentSoft: "#dcebf3", accentDark: "#2f5f7d", cover: "#8fb6cc", coverDeep: "#5b88a3", line: "rgba(40,70,95,.12)", shadow: "rgba(25,45,65,.2)", backdrop: "#e4ebef", glow: "#cfe6e4" },
  },
  {
    id: "ember", name: "Ember hour", note: "golden & cosy", dark: false,
    tokens: { ink: "#3a2e25", muted: "#85735f", paper: "#fffaf0", paperDeep: "#f7ecda", accent: "#c27a3a", accentSoft: "#f8e4cc", accentDark: "#8a521f", cover: "#d9a066", coverDeep: "#a86e37", line: "rgba(110,75,40,.13)", shadow: "rgba(80,50,20,.2)", backdrop: "#f1e7db", glow: "#f6cfa0" },
  },
  {
    id: "graphite", name: "Field notes", note: "minimal & focused", dark: false,
    tokens: { ink: "#22252a", muted: "#6e737a", paper: "#fbfbf9", paperDeep: "#efefeb", accent: "#3f4652", accentSoft: "#e3e5e8", accentDark: "#1f242c", cover: "#5d6470", coverDeep: "#383e48", line: "rgba(30,35,45,.11)", shadow: "rgba(20,24,30,.2)", backdrop: "#e8e8e4", glow: "#e6e1d6" },
  },
  {
    id: "midnight", name: "Stargazer", note: "deep & celestial", dark: true,
    tokens: { ink: "#eae6ef", muted: "#aca2b8", paper: "#252231", paperDeep: "#1f1d2b", accent: "#bca8ef", accentSoft: "#3f3757", accentDark: "#d9cdfa", cover: "#342d4a", coverDeep: "#1d1930", line: "rgba(255,255,255,.08)", shadow: "rgba(5,4,10,.5)", backdrop: "#15131d", glow: "#3b2f5c" },
  },
  {
    id: "aurora", name: "Aurora", note: "northern & luminous", dark: true,
    tokens: { ink: "#e3efec", muted: "#97b1ab", paper: "#1b2a2a", paperDeep: "#162222", accent: "#6fd6b5", accentSoft: "#24443e", accentDark: "#a9ecd7", cover: "#24403c", coverDeep: "#122321", line: "rgba(255,255,255,.08)", shadow: "rgba(0,8,8,.5)", backdrop: "#0f1919", glow: "#1f4a52" },
  },
  {
    id: "velvet", name: "Velvet night", note: "rich & intimate", dark: true,
    tokens: { ink: "#f1e6ea", muted: "#b9a0aa", paper: "#2b1f26", paperDeep: "#23191f", accent: "#e59ab5", accentSoft: "#4a2f3b", accentDark: "#f6c6d7", cover: "#4a2636", coverDeep: "#2a121d", line: "rgba(255,255,255,.08)", shadow: "rgba(10,2,6,.5)", backdrop: "#170f13", glow: "#4f2337" },
  },
];

/* ───────────────────────── Fonts ───────────────────────── */

export type FontOption = { id: string; name: string; note: string; stack: string; kind: "serif" | "sans" | "script" | "mono" };

/** Every font a journal may use. Stacks reference CSS variables provided by next/font (web). */
export const fonts: FontOption[] = [
  { id: "fraunces", name: "Fraunces", note: "soft, storybook serif", stack: "var(--font-fraunces), Georgia, serif", kind: "serif" },
  { id: "lora", name: "Lora", note: "warm reading serif", stack: "var(--font-lora), Georgia, serif", kind: "serif" },
  { id: "cormorant", name: "Cormorant", note: "elegant old-style", stack: "var(--font-cormorant), Georgia, serif", kind: "serif" },
  { id: "garamond", name: "EB Garamond", note: "classic book face", stack: "var(--font-garamond), Georgia, serif", kind: "serif" },
  { id: "newsreader", name: "Newsreader", note: "crisp editorial", stack: "var(--font-newsreader), Georgia, serif", kind: "serif" },
  { id: "playfair", name: "Playfair", note: "high-contrast display", stack: "var(--font-playfair), Georgia, serif", kind: "serif" },
  { id: "frank", name: "Frank Ruhl", note: "Hebrew & Latin serif", stack: "var(--font-frank), \"Times New Roman\", serif", kind: "serif" },
  { id: "caveat", name: "Caveat", note: "handwritten pen", stack: "var(--font-caveat), \"Segoe Print\", cursive", kind: "script" },
  { id: "courier", name: "Courier Prime", note: "typewriter", stack: "var(--font-courier), \"Courier New\", monospace", kind: "mono" },
  { id: "inter", name: "Inter", note: "clean sans", stack: "var(--font-inter), system-ui, sans-serif", kind: "sans" },
];

export function fontById(id: string | null | undefined) {
  return fonts.find((font) => font.id === id) ?? null;
}

export type TypographyOption = { id: string; name: string; note: string; heading: string; body: string };

/** Lettering presets: a heading + body pairing. Either can be overridden independently. */
export const typographies: TypographyOption[] = [
  { id: "storybook", name: "Storybook", note: "soft serif, gentle curves", heading: "fraunces", body: "lora" },
  { id: "classic", name: "Old library", note: "elegant & literary", heading: "cormorant", body: "garamond" },
  { id: "handwritten", name: "Handwritten", note: "like your own pen", heading: "caveat", body: "lora" },
  { id: "editorial", name: "Editorial", note: "crisp & considered", heading: "playfair", body: "newsreader" },
  { id: "typewriter", name: "Typewriter", note: "field notes at dawn", heading: "courier", body: "courier" },
  { id: "scroll", name: "Scroll", note: "Hebrew-ready serif", heading: "frank", body: "frank" },
  { id: "modern", name: "Modern", note: "clean & quiet", heading: "inter", body: "inter" },
];

/* ───────────────────────── Option lists ───────────────────────── */

export type SimpleOption = { id: string; name: string; note: string };

export const covers: SimpleOption[] = [
  { id: "classic", name: "Cloth", note: "plain bound cover" },
  { id: "linen", name: "Linen", note: "woven texture" },
  { id: "marbled", name: "Marbled", note: "swirled endpapers" },
  { id: "celestial", name: "Celestial", note: "scattered stars" },
  { id: "botanical", name: "Botanical", note: "pressed leaves" },
  { id: "leather", name: "Leather", note: "worn & stitched" },
];

export const papers: SimpleOption[] = [
  { id: "lined", name: "Lined", note: "classic ruled" },
  { id: "dotted", name: "Dotted", note: "bullet-journal grid" },
  { id: "grid", name: "Graph", note: "fine squares" },
  { id: "parchment", name: "Parchment", note: "aged & warm" },
  { id: "blank", name: "Blank", note: "nothing in the way" },
];

export const densities: SimpleOption[] = [
  { id: "airy", name: "Airy", note: "room to breathe" },
  { id: "balanced", name: "Balanced", note: "a little of both" },
  { id: "compact", name: "Compact", note: "more on each page" },
];

export const promptStyles: SimpleOption[] = [
  { id: "gentle", name: "Gentle", note: "warm, encouraging prompts" },
  { id: "minimal", name: "Minimal", note: "just the page" },
  { id: "reflective", name: "Reflective", note: "deeper questions" },
];

export const layouts: SimpleOption[] = [
  { id: "spread", name: "Open spread", note: "index and page side by side" },
  { id: "focus", name: "Single page", note: "one wide page, index tucked away" },
];

export const cornerStyles: SimpleOption[] = [
  { id: "rounded", name: "Rounded", note: "soft, pillowy corners" },
  { id: "soft", name: "Eased", note: "gently softened" },
  { id: "square", name: "Square", note: "crisp, bookbinder's edge" },
];

export const backdrops: SimpleOption[] = [
  { id: "soft", name: "Morning haze", note: "soft glow around the book" },
  { id: "linen", name: "Linen sheet", note: "woven bedside cloth" },
  { id: "desk", name: "Oak desk", note: "warm wood grain" },
  { id: "night", name: "Night sky", note: "stars beyond the page" },
  { id: "plain", name: "Plain", note: "a single quiet colour" },
];

export const ornamentSets: Array<SimpleOption & { glyphs: [string, string] }> = [
  { id: "stars", name: "Stars", note: "little constellations", glyphs: ["✦ · ˚ ✧", "☾"] },
  { id: "moons", name: "Moon phases", note: "the night turning", glyphs: ["◐ ○ ◑", "☽"] },
  { id: "botanical", name: "Pressed flowers", note: "sprigs and petals", glyphs: ["❀ · ✿", "❦"] },
  { id: "hearts", name: "Hearts", note: "small tender marks", glyphs: ["♡ · ♡", "❥"] },
  { id: "none", name: "None", note: "a clean page", glyphs: ["", ""] },
];

export const emblems: SimpleOption[] = [
  { id: "moon", name: "Crescent", note: "" },
  { id: "star", name: "Star", note: "" },
  { id: "eye", name: "Open eye", note: "" },
  { id: "flower", name: "Flower", note: "" },
  { id: "feather", name: "Feather", note: "" },
  { id: "key", name: "Key", note: "" },
  { id: "none", name: "None", note: "" },
];

/* ───────────────────────── Appearance ───────────────────────── */

export type Appearance = {
  /** Starting palette; the individual colours below override it. */
  theme: string;
  /** Lettering preset; headingFont / bodyFont override it. */
  typography: string;
  cover: string;
  paper: string;
  pageDensity: string;
  promptStyle: string;
  accentColor: string | null;
  paperColor: string | null;
  inkColor: string | null;
  coverColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  /** 0.85 – 1.3 */
  textScale: number;
  /** null follows page density; otherwise 1.3 – 2.3 */
  lineSpacing: number | null;
  corners: string;
  layout: string;
  backdrop: string;
  ornamentSet: string;
  /** Kept for older clients; equivalent to ornamentSet !== "none". */
  showOrnaments: boolean;
  emblem: string;
  bookTitle: string | null;
  ribbon: boolean;
  dropCap: boolean;
  grain: boolean;
};

export const defaultAppearance: Appearance = {
  theme: "lavender",
  typography: "storybook",
  cover: "classic",
  paper: "lined",
  pageDensity: "airy",
  promptStyle: "gentle",
  accentColor: null,
  paperColor: null,
  inkColor: null,
  coverColor: null,
  headingFont: null,
  bodyFont: null,
  textScale: 1,
  lineSpacing: null,
  corners: "rounded",
  layout: "spread",
  backdrop: "soft",
  ornamentSet: "stars",
  showOrnaments: true,
  emblem: "moon",
  bookTitle: null,
  ribbon: true,
  dropCap: true,
  grain: true,
};

/** Fields stored in dedicated columns; everything else lives in the flexible `design` JSON column. */
export const columnAppearanceKeys = ["theme", "typography", "cover", "paper", "pageDensity", "promptStyle", "accentColor", "showOrnaments"] as const;

export type JournalStyleTemplate = {
  key: string;
  name: string;
  description: string;
  appearance: Appearance;
};

const d = defaultAppearance;

/** Built-in journal styles: complete looks to start from. Everything stays editable afterwards. */
export const journalStyles: JournalStyleTemplate[] = [
  { key: "lavender-dusk", name: "Lavender Dusk", description: "The original Tardemah book: soft serif pages and lilac cloth.", appearance: { ...d } },
  { key: "pressed-rose", name: "Pressed Rose", description: "Old-library type on warm parchment, a botanical cover.", appearance: { ...d, theme: "rose", typography: "classic", cover: "botanical", paper: "parchment", ornamentSet: "botanical", emblem: "flower", backdrop: "linen" } },
  { key: "quiet-garden", name: "Quiet Garden", description: "Earthy greens, linen binding and a dotted page.", appearance: { ...d, theme: "sage", typography: "editorial", cover: "linen", paper: "dotted", pageDensity: "balanced", ornamentSet: "botanical", emblem: "feather", corners: "soft" } },
  { key: "tidepool", name: "Tidepool", description: "Cool blues and marbled endpapers for clear-headed mornings.", appearance: { ...d, theme: "tidepool", typography: "editorial", cover: "marbled", pageDensity: "balanced", ornamentSet: "moons", emblem: "eye", corners: "soft" } },
  { key: "ember-hour", name: "Ember Hour", description: "Handwritten headings by candlelight, worn leather on an oak desk.", appearance: { ...d, theme: "ember", typography: "handwritten", cover: "leather", paper: "parchment", backdrop: "desk", emblem: "key", corners: "soft" } },
  { key: "field-notes", name: "Field Notes", description: "Typewriter, graph paper, square corners. Just the record.", appearance: { ...d, theme: "graphite", typography: "typewriter", cover: "leather", paper: "grid", pageDensity: "compact", promptStyle: "minimal", ornamentSet: "none", showOrnaments: false, corners: "square", dropCap: false, emblem: "none", backdrop: "plain" } },
  { key: "stargazer", name: "Stargazer", description: "A midnight book with a cover full of stars, under the night sky.", appearance: { ...d, theme: "midnight", cover: "celestial", paper: "blank", backdrop: "night", emblem: "star" } },
  { key: "aurora", name: "Aurora", description: "Luminous greens on deep night pages, with deeper prompts.", appearance: { ...d, theme: "aurora", typography: "modern", cover: "celestial", paper: "dotted", promptStyle: "reflective", backdrop: "night", ornamentSet: "moons", emblem: "eye", dropCap: false } },
  { key: "velvet-night", name: "Velvet Night", description: "Rich plum pages and an old-library hand.", appearance: { ...d, theme: "velvet", typography: "classic", cover: "marbled", paper: "lined", promptStyle: "reflective", ornamentSet: "hearts", emblem: "flower" } },
  { key: "scroll", name: "Scroll", description: "Frank Ruhl lettering on aged paper, at home in Hebrew and English.", appearance: { ...d, theme: "ember", typography: "scroll", cover: "leather", paper: "parchment", ornamentSet: "none", showOrnaments: false, emblem: "key", corners: "square", accentColor: "#8a5a2b", backdrop: "linen" } },
];

/* ───────────────────────── Validation ───────────────────────── */

const ids = (items: Array<{ id: string }>) => new Set(items.map((item) => item.id));
const allowed = {
  theme: ids(palettes),
  typography: ids(typographies),
  cover: ids(covers),
  paper: ids(papers),
  pageDensity: ids(densities),
  promptStyle: ids(promptStyles),
  corners: ids(cornerStyles),
  layout: ids(layouts),
  backdrop: ids(backdrops),
  ornamentSet: ids(ornamentSets),
  emblem: ids(emblems),
};
const fontIds = ids(fonts);

const HEX = /^#[0-9a-f]{6}$/i;
const colorKeys = ["accentColor", "paperColor", "inkColor", "coverColor"] as const;
const booleanKeys = ["ribbon", "dropCap", "grain"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Returns only valid appearance fields from untrusted input. Unknown or invalid values are dropped. */
export function sanitizeAppearance(input: unknown): Partial<Appearance> {
  if (!input || typeof input !== "object") return {};
  const value = input as Record<string, unknown>;
  const result: Partial<Appearance> = {};

  for (const key of Object.keys(allowed) as Array<keyof typeof allowed>) {
    const candidate = value[key];
    if (typeof candidate === "string" && allowed[key].has(candidate)) result[key] = candidate;
  }

  for (const key of colorKeys) {
    const candidate = value[key];
    if (candidate === null || candidate === "") result[key] = null;
    else if (typeof candidate === "string" && HEX.test(candidate)) result[key] = candidate.toLowerCase();
  }

  for (const key of ["headingFont", "bodyFont"] as const) {
    const candidate = value[key];
    if (candidate === null || candidate === "") result[key] = null;
    else if (typeof candidate === "string" && fontIds.has(candidate)) result[key] = candidate;
  }

  if (typeof value.textScale === "number" && Number.isFinite(value.textScale)) {
    result.textScale = Math.round(clamp(value.textScale, 0.85, 1.3) * 100) / 100;
  }
  if (value.lineSpacing === null) result.lineSpacing = null;
  else if (typeof value.lineSpacing === "number" && Number.isFinite(value.lineSpacing)) {
    result.lineSpacing = Math.round(clamp(value.lineSpacing, 1.3, 2.3) * 100) / 100;
  }

  for (const key of booleanKeys) {
    if (typeof value[key] === "boolean") result[key] = value[key] as boolean;
  }

  if (value.bookTitle === null) result.bookTitle = null;
  else if (typeof value.bookTitle === "string") result.bookTitle = value.bookTitle.trim().slice(0, 48) || null;

  // Keep the legacy boolean and the ornament set in agreement.
  if (result.ornamentSet !== undefined) result.showOrnaments = result.ornamentSet !== "none";
  else if (typeof value.showOrnaments === "boolean") {
    result.showOrnaments = value.showOrnaments;
    if (!value.showOrnaments) result.ornamentSet = "none";
  }

  return result;
}

export function completeAppearance(input: unknown): Appearance {
  const appearance = { ...defaultAppearance, ...sanitizeAppearance(input) };
  // Looks saved before ornament sets existed only knew the boolean.
  if (!appearance.showOrnaments) appearance.ornamentSet = "none";
  return appearance;
}

/* ───────────────────────── Rendering ───────────────────────── */

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function mix(hexA: string, hexB: string, weightA: number) {
  if (!HEX.test(hexA) || !HEX.test(hexB)) return hexA;
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const channel = (i: number) => Math.round(a[i] * weightA + b[i] * (1 - weightA)).toString(16).padStart(2, "0");
  return "#" + channel(0) + channel(1) + channel(2);
}

function rgba(hex: string, alpha: number) {
  if (!HEX.test(hex)) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Relative luminance (0 = black, 1 = white). */
export function luminance(hex: string) {
  if (!HEX.test(hex)) return 1;
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function paletteById(id: string) {
  return palettes.find((palette) => palette.id === id) ?? palettes[0];
}

export function typographyById(id: string) {
  return typographies.find((typography) => typography.id === id) ?? typographies[0];
}

export function ornamentGlyphs(appearance: Pick<Appearance, "ornamentSet">) {
  return (ornamentSets.find((set) => set.id === appearance.ornamentSet) ?? ornamentSets[0]).glyphs;
}

/** Whether the resolved page is dark (drives contrast tweaks). */
export function isDarkAppearance(appearance: Appearance) {
  if (appearance.paperColor) return luminance(appearance.paperColor) < 0.22;
  return paletteById(appearance.theme).dark;
}

/** The resolved colours of a look, for swatches and pickers. */
export function resolvedColors(appearance: Appearance) {
  const vars = appearanceToCssVars(appearance);
  return { paper: vars["--paper"], ink: vars["--ink"], accent: vars["--accent"], cover: vars["--cover-deep"] };
}

/** Resolves an appearance into CSS custom properties understood by the web journal. */
export function appearanceToCssVars(appearance: Appearance): Record<string, string> {
  const palette = paletteById(appearance.theme);
  const type = typographyById(appearance.typography);
  const t = { ...palette.tokens };
  const dark = isDarkAppearance(appearance);

  if (appearance.paperColor) {
    const paper = appearance.paperColor;
    t.paper = paper;
    t.paperDeep = mix(paper, dark ? "#000000" : "#6b5a50", dark ? 0.82 : 0.93);
    t.backdrop = mix(paper, dark ? "#000000" : "#8a7a70", dark ? 0.6 : 0.86);
    t.shadow = dark ? "rgba(0,0,0,.5)" : "rgba(50,38,44,.18)";
  }
  if (appearance.inkColor) {
    const ink = appearance.inkColor;
    t.ink = ink;
    t.muted = mix(ink, t.paper, 0.6);
    t.line = rgba(ink, dark ? 0.12 : 0.11);
  } else if (appearance.paperColor) {
    t.ink = dark ? "#ece6ef" : "#2f2a33";
    t.muted = mix(t.ink, t.paper, 0.6);
    t.line = rgba(t.ink, dark ? 0.1 : 0.11);
  }
  if (appearance.accentColor || appearance.paperColor) {
    const accent = appearance.accentColor ?? t.accent;
    t.accent = accent;
    t.accentSoft = mix(accent, t.paper, dark ? 0.32 : 0.2);
    t.accentDark = mix(accent, dark ? "#ffffff" : "#000000", dark ? 0.45 : 0.62);
    if (appearance.accentColor && !appearance.coverColor) {
      t.cover = mix(accent, dark ? "#000000" : "#ffffff", dark ? 0.45 : 0.62);
      t.coverDeep = mix(accent, "#000000", dark ? 0.3 : 0.82);
    }
    t.glow = mix(accent, t.paper, 0.25);
  }
  if (appearance.coverColor) {
    t.cover = mix(appearance.coverColor, "#ffffff", 0.78);
    t.coverDeep = appearance.coverColor;
  }

  const heading = fontById(appearance.headingFont ?? type.heading) ?? fonts[0];
  const body = fontById(appearance.bodyFont ?? type.body) ?? fonts[1];
  const radius = appearance.corners === "square" ? "3px" : appearance.corners === "soft" ? "10px" : "22px";

  const vars: Record<string, string> = {
    "--ink": t.ink,
    "--muted": t.muted,
    "--paper": t.paper,
    "--paper-deep": t.paperDeep,
    "--accent": t.accent,
    "--accent-soft": t.accentSoft,
    "--accent-dark": t.accentDark,
    "--cover": t.cover,
    "--cover-deep": t.coverDeep,
    "--line": t.line,
    "--shadow": t.shadow,
    "--backdrop": t.backdrop,
    "--glow": t.glow,
    "--display": heading.stack,
    "--serif": body.stack,
    "--sans": "var(--font-inter), system-ui, sans-serif",
    "--text-scale": String(appearance.textScale),
    "--book-radius": radius,
    // Script faces read small and monospace faces read wide; nudge them so the page stays balanced.
    "--display-adjust": heading.kind === "script" ? "1.14" : heading.kind === "mono" ? "0.84" : "1",
    "--body-adjust": body.kind === "mono" ? "0.9" : body.kind === "script" ? "1.14" : "1",
  };
  if (appearance.lineSpacing) vars["--body-leading"] = String(appearance.lineSpacing);
  return vars;
}

/** Data attributes that select textures and layout in CSS. */
export function appearanceDataAttributes(appearance: Appearance): Record<string, string> {
  return {
    cover: appearance.cover,
    paper: appearance.paper,
    density: appearance.pageDensity,
    ornaments: appearance.ornamentSet === "none" ? "off" : "on",
    dark: isDarkAppearance(appearance) ? "true" : "false",
    layout: appearance.layout,
    backdrop: appearance.backdrop,
    grain: appearance.grain ? "on" : "off",
    dropcap: appearance.dropCap ? "on" : "off",
    ribbon: appearance.ribbon ? "on" : "off",
    corners: appearance.corners,
  };
}
