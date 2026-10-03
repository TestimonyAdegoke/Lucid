"use client";

import {
  backdrops,
  cornerStyles,
  covers,
  defaultAppearance,
  densities,
  emblems,
  fonts,
  journalStyles,
  layouts,
  ornamentSets,
  palettes,
  papers,
  promptStyles,
  resolvedColors,
  typographies,
  type Appearance,
} from "@tardemah/domain";
import { Check, Pencil, Plus, RotateCcw, Star, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Emblem } from "@/components/brand";
import { appearanceScope, JournalPreview } from "@/components/journal-preview";
import { TemplateEditor } from "@/components/template-editor";
import { api, applyAppearance, type Me, type Style, type Template } from "@/lib/client";
import type { SerializedPreferences } from "@/lib/preferences";
import { useEscape } from "@/lib/use-escape";

type Tab = "design" | "templates" | "you";

export function Studio({
  me,
  initialTab = "design",
  onChange,
  onClose,
}: {
  me: Me;
  initialTab?: Tab;
  onChange: (next: Me) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const meRef = useRef(me);
  meRef.current = me;
  useEscape(onClose);

  const canWrite = me.workspace.role !== "VIEWER";

  function patchMe(patch: Partial<Me>) {
    onChange({ ...meRef.current, ...patch });
  }

  function setPreferences(preferences: SerializedPreferences) {
    applyAppearance(preferences.appearance);
    patchMe({ preferences });
  }

  return (
    <div className="studio-sheet" role="dialog" aria-modal="true" aria-label="Design studio">
      <header className="studio-bar">
        <div className="studio-title">
          <span className="eyebrow">Design studio</span>
          <strong>{me.preferences.appearance.bookTitle || me.workspace.name}</strong>
        </div>
        <nav className="studio-tabs" role="tablist">
          {([
            ["design", "Design"],
            ["templates", "Entry templates"],
            ["you", "You"],
          ] as const).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <button className="studio-done" onClick={onClose}>Done</button>
      </header>

      {error && <div className="studio-error" role="alert">{error} <button onClick={() => setError(null)} aria-label="Dismiss"><X size={13} /></button></div>}

      {tab === "design" && (
        <DesignTab
          me={me}
          canWrite={canWrite}
          onPreferences={setPreferences}
          onStyles={(styles) => patchMe({ styles })}
          onError={setError}
        />
      )}
      {tab === "templates" && (
        <div className="studio-page">
          <TemplatesTab me={me} canWrite={canWrite} onTemplates={(templates) => patchMe({ templates })} onPreferences={setPreferences} onError={setError} />
        </div>
      )}
      {tab === "you" && (
        <div className="studio-page">
          <ProfileTab me={me} onPreferences={setPreferences} onError={setError} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Design ───────────────────────── */

function DesignTab({
  me,
  canWrite,
  onPreferences,
  onStyles,
  onError,
}: {
  me: Me;
  canWrite: boolean;
  onPreferences: (preferences: SerializedPreferences) => void;
  onStyles: (styles: Style[]) => void;
  onError: (message: string | null) => void;
}) {
  const appearance = me.preferences.appearance;
  const pending = useRef<Partial<Appearance>>({});
  const timer = useRef<number | null>(null);
  const [saveName, setSaveName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  /** Applies a change instantly and saves it shortly after (so dragging a colour doesn't flood the API). */
  function set(patch: Partial<Appearance>) {
    onError(null);
    onPreferences({ ...me.preferences, appearance: { ...appearance, ...patch }, styleKey: "custom" });
    pending.current = { ...pending.current, ...patch };
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const body = pending.current;
      pending.current = {};
      try {
        await api("/api/preferences", { method: "PATCH", json: { appearance: body } });
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1200);
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : "Tardemah could not save that change.");
      }
    }, 450);
  }

  async function applyStyle(style: Style) {
    setBusy(style.key);
    onError(null);
    const previous = me.preferences;
    onPreferences({ ...previous, appearance: style.appearance, styleKey: style.key });
    try {
      const payload = await api<{ preferences: SerializedPreferences }>("/api/preferences", { method: "PATCH", json: { styleKey: style.key } });
      onPreferences(payload.preferences);
    } catch (cause) {
      onPreferences(previous);
      onError(cause instanceof Error ? cause.message : "Tardemah could not apply that style.");
    } finally {
      setBusy(null);
    }
  }

  async function saveCurrent() {
    if (!saveName.trim()) return;
    setBusy("save");
    onError(null);
    try {
      const payload = await api<{ style: Style }>("/api/styles", { method: "POST", json: { name: saveName, appearance } });
      onStyles([...me.styles, payload.style]);
      onPreferences({ ...me.preferences, styleKey: payload.style.key });
      setSaveName("");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not save this style.");
    } finally {
      setBusy(null);
    }
  }

  async function removeStyle(style: Style) {
    if (!window.confirm("Remove the “" + style.name + "” style from this dream book?")) return;
    try {
      await api("/api/styles/" + style.key, { method: "DELETE" });
      onStyles(me.styles.filter((item) => item.key !== style.key));
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not remove this style.");
    }
  }

  const colors = resolvedColors(appearance);
  const preset = typographies.find((item) => item.id === appearance.typography) ?? typographies[0];
  const headingFont = appearance.headingFont ?? preset.heading;
  const bodyFont = appearance.bodyFont ?? preset.body;
  const blankCanvas: Style = {
    key: "blank-canvas",
    name: "Blank canvas",
    description: "Plain paper, no ornaments — build it up yourself.",
    system: true,
    appearance: { ...defaultAppearance, paperColor: "#fbf9f4", inkColor: "#26232a", accentColor: "#5b5b66", coverColor: "#3a3a42", paper: "blank", ornamentSet: "none", showOrnaments: false, emblem: "none", dropCap: false, backdrop: "plain", corners: "soft" },
  };

  return (
    <div className="studio-design">
      <div className="studio-stage backdrop-surface" {...appearanceScope(appearance)}>
        <div className="studio-stage-book">
          <JournalPreview appearance={appearance} size="xl" bookTitle={me.workspace.name} />
        </div>
        <p className="studio-stage-note">
          {savedFlash ? <><Check size={13} /> Saved to your account</> : me.preferences.styleKey === "custom" ? "Your own design" : "Based on " + (me.styles.find((style) => style.key === me.preferences.styleKey)?.name ?? "a style")}
        </p>
      </div>

      <div className="studio-controls">
        <Section title="Start from a style" hint="A complete look in one tap. Everything below stays editable.">
          <div className="style-rail">
            {[...me.styles.filter((style) => style.system), blankCanvas].map((style) => (
              <StyleCard
                key={style.key}
                style={style}
                active={me.preferences.styleKey === style.key}
                busy={busy === style.key}
                onApply={() => (style.key === "blank-canvas" ? set(style.appearance) : void applyStyle(style))}
              />
            ))}
          </div>
          {me.styles.some((style) => !style.system) && (
            <>
              <span className="control-label">Saved in {me.workspace.isPersonal ? "your book" : me.workspace.name}</span>
              <div className="style-rail">
                {me.styles.filter((style) => !style.system).map((style) => (
                  <StyleCard
                    key={style.key}
                    style={style}
                    active={me.preferences.styleKey === style.key}
                    busy={busy === style.key}
                    onApply={() => void applyStyle(style)}
                    onRemove={canWrite && (style.createdById === me.user.id || me.workspace.role === "OWNER" || me.workspace.role === "ADMIN") ? () => void removeStyle(style) : undefined}
                  />
                ))}
              </div>
            </>
          )}
          {canWrite && (
            <div className="inline-save">
              <input value={saveName} onChange={(event) => setSaveName(event.target.value)} placeholder="Name this look to reuse it…" aria-label="Style name" maxLength={60} />
              <button type="button" className="pill-button" onClick={() => void saveCurrent()} disabled={!saveName.trim() || busy === "save"}><Plus size={14} /> Save style</button>
            </div>
          )}
        </Section>

        <Section title="Colour" hint="Pick a palette, then make any colour your own.">
          <div className="palette-row">
            {palettes.map((palette) => {
              const selected = appearance.theme === palette.id && !appearance.paperColor && !appearance.inkColor && !appearance.accentColor && !appearance.coverColor;
              return (
                <button
                  key={palette.id}
                  type="button"
                  className={"palette-swatch " + (selected ? "selected" : "")}
                  onClick={() => set({ theme: palette.id, accentColor: null, paperColor: null, inkColor: null, coverColor: null })}
                  title={palette.name + " — " + palette.note}
                  aria-label={palette.name}
                  aria-pressed={selected}
                >
                  <i style={{ background: palette.tokens.paper }} />
                  <i style={{ background: palette.tokens.accent }} />
                  <i style={{ background: palette.tokens.coverDeep }} />
                </button>
              );
            })}
          </div>
          <div className="color-grid">
            <ColorControl label="Paper" value={colors.paper} custom={appearance.paperColor} onChange={(value) => set({ paperColor: value })} />
            <ColorControl label="Ink" value={colors.ink} custom={appearance.inkColor} onChange={(value) => set({ inkColor: value })} />
            <ColorControl label="Accent" value={colors.accent} custom={appearance.accentColor} onChange={(value) => set({ accentColor: value })} />
            <ColorControl label="Cover" value={colors.cover} custom={appearance.coverColor} onChange={(value) => set({ coverColor: value })} />
          </div>
        </Section>

        <Section title="Lettering" hint="Choose a pairing, or set the heading and body faces separately.">
          <div className="chip-row wrap">
            {typographies.map((type) => (
              <button
                key={type.id}
                type="button"
                className={"type-chip " + (appearance.typography === type.id && !appearance.headingFont && !appearance.bodyFont ? "selected" : "")}
                onClick={() => set({ typography: type.id, headingFont: null, bodyFont: null })}
                title={type.note}
              >
                <span style={{ fontFamily: fonts.find((font) => font.id === type.heading)?.stack }}>{type.name}</span>
              </button>
            ))}
          </div>
          <span className="control-label">Headings</span>
          <FontGrid value={headingFont} onChange={(id) => set({ headingFont: id })} />
          <span className="control-label">Writing</span>
          <FontGrid value={bodyFont} onChange={(id) => set({ bodyFont: id })} />
          <div className="slider-row">
            <label>
              <span>Text size <b>{Math.round(appearance.textScale * 100)}%</b></span>
              <input type="range" min="0.85" max="1.3" step="0.05" value={appearance.textScale} onChange={(event) => set({ textScale: Number(event.target.value) })} />
            </label>
            <label>
              <span>Line spacing <b>{appearance.lineSpacing ? appearance.lineSpacing.toFixed(2) : "auto"}</b></span>
              <input type="range" min="1.3" max="2.3" step="0.05" value={appearance.lineSpacing ?? 1.8} onChange={(event) => set({ lineSpacing: Number(event.target.value) })} />
            </label>
            {appearance.lineSpacing && <button type="button" className="text-button" onClick={() => set({ lineSpacing: null })}><RotateCcw size={12} /> auto</button>}
          </div>
        </Section>

        <Section title="The book" hint="Its name, its mark, and how it's bound.">
          <label className="text-control">
            <span className="control-label">Title on the bookplate</span>
            <input value={appearance.bookTitle ?? ""} onChange={(event) => set({ bookTitle: event.target.value || null })} placeholder={me.workspace.name} maxLength={48} />
          </label>
          <span className="control-label">Emblem</span>
          <div className="emblem-row">
            {emblems.map((emblem) => (
              <button key={emblem.id} type="button" className={appearance.emblem === emblem.id ? "selected" : ""} onClick={() => set({ emblem: emblem.id })} title={emblem.name} aria-label={emblem.name} aria-pressed={appearance.emblem === emblem.id}>
                {emblem.id === "none" ? <X size={14} /> : <Emblem emblem={emblem.id} size={17} />}
              </button>
            ))}
          </div>
          <span className="control-label">Cover</span>
          <div className="swatch-grid">
            {covers.map((cover) => (
              <button key={cover.id} type="button" className={"swatch-option " + (appearance.cover === cover.id ? "selected" : "")} onClick={() => set({ cover: cover.id })} aria-pressed={appearance.cover === cover.id}>
                <span className="swatch-preview cover-surface" data-cover={cover.id} />
                <span>{cover.name}</span>
              </button>
            ))}
          </div>
          <div className="toggle-grid">
            <Toggle label="Ribbon bookmark" checked={appearance.ribbon} onChange={(ribbon) => set({ ribbon })} />
          </div>
          <span className="control-label">Corners</span>
          <Segmented options={cornerStyles} value={appearance.corners} onChange={(corners) => set({ corners })} />
        </Section>

        <Section title="The page" hint="Paper, texture, and how much fits on it.">
          <div className="swatch-grid">
            {papers.map((paper) => (
              <button key={paper.id} type="button" className={"swatch-option " + (appearance.paper === paper.id ? "selected" : "")} onClick={() => set({ paper: paper.id })} aria-pressed={appearance.paper === paper.id}>
                <span className="swatch-preview" {...appearanceScope({ ...appearance, paper: paper.id })}><span className="paper-surface" /></span>
                <span>{paper.name}</span>
              </button>
            ))}
          </div>
          <div className="toggle-grid">
            <Toggle label="Paper grain" checked={appearance.grain} onChange={(grain) => set({ grain })} />
            <Toggle label="Drop capital" checked={appearance.dropCap} onChange={(dropCap) => set({ dropCap })} />
          </div>
          <span className="control-label">Density</span>
          <Segmented options={densities} value={appearance.pageDensity} onChange={(pageDensity) => set({ pageDensity })} />
          <span className="control-label">Layout</span>
          <Segmented options={layouts} value={appearance.layout} onChange={(layout) => set({ layout })} />
        </Section>

        <Section title="Around the book" hint="The surface your book rests on.">
          <div className="swatch-grid">
            {backdrops.map((backdrop) => (
              <button key={backdrop.id} type="button" className={"swatch-option " + (appearance.backdrop === backdrop.id ? "selected" : "")} onClick={() => set({ backdrop: backdrop.id })} aria-pressed={appearance.backdrop === backdrop.id}>
                <span className="swatch-preview backdrop-surface" {...appearanceScope({ ...appearance, backdrop: backdrop.id })} />
                <span>{backdrop.name}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Little details" hint="Marginalia and the voice of your prompts.">
          <span className="control-label">Doodles</span>
          <div className="chip-row wrap">
            {ornamentSets.map((set_) => (
              <button key={set_.id} type="button" className={appearance.ornamentSet === set_.id ? "selected" : ""} onClick={() => set({ ornamentSet: set_.id })}>
                {set_.glyphs[1] && <span className="glyph">{set_.glyphs[1]}</span>}{set_.name}
              </button>
            ))}
          </div>
          <span className="control-label">Prompt voice</span>
          <Segmented options={promptStyles} value={appearance.promptStyle} onChange={(promptStyle) => set({ promptStyle })} />
        </Section>

        <button type="button" className="reset-design" onClick={() => void applyStyle({ key: "lavender-dusk", name: "", description: "", system: true, appearance: journalStyles[0].appearance })}>
          <RotateCcw size={13} /> Start over from Lavender Dusk
        </button>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="studio-section">
      <header>
        <h3>{title}</h3>
        <p>{hint}</p>
      </header>
      {children}
    </section>
  );
}

function StyleCard({ style, active, busy, onApply, onRemove }: { style: Style; active: boolean; busy: boolean; onApply: () => void; onRemove?: () => void }) {
  return (
    <div className={"style-card " + (active ? "active" : "")}>
      <button type="button" className="style-card-main" onClick={onApply} disabled={busy} aria-pressed={active} title={style.description}>
        <JournalPreview appearance={style.appearance} size="sm" />
        <span className="style-card-name">{style.name} {active && <Check size={12} />}</span>
      </button>
      {onRemove && <button type="button" className="style-card-remove" onClick={onRemove} aria-label={"Remove " + style.name}><Trash2 size={12} /></button>}
    </div>
  );
}

function ColorControl({ label, value, custom, onChange }: { label: string; value: string; custom: string | null; onChange: (value: string | null) => void }) {
  return (
    <div className={"color-control " + (custom ? "custom" : "")}>
      <label>
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label + " colour"} />
        <span className="color-dot" style={{ background: value }} />
        <span className="color-text"><strong>{label}</strong><small>{custom ? value : "from palette"}</small></span>
      </label>
      {custom && <button type="button" onClick={() => onChange(null)} aria-label={"Reset " + label} title="Back to palette"><RotateCcw size={12} /></button>}
    </div>
  );
}

function FontGrid({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="font-grid" role="radiogroup">
      {fonts.map((font) => (
        <button key={font.id} type="button" role="radio" aria-checked={value === font.id} className={value === font.id ? "selected" : ""} onClick={() => onChange(font.id)} title={font.note}>
          <span className="font-sample" style={{ fontFamily: font.stack }}>{font.id === "frank" ? "Aa א" : "Aa"}</span>
          <span className="font-name">{font.name}</span>
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-control">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="share-switch" />
      <span>{label}</span>
    </label>
  );
}

function Segmented({ options, value, onChange }: { options: Array<{ id: string; name: string; note: string }>; value: string; onChange: (value: string) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((option) => (
        <button key={option.id} type="button" role="radio" aria-checked={value === option.id} className={value === option.id ? "selected" : ""} onClick={() => onChange(option.id)} title={option.note}>
          {option.name}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Entry templates ───────────────────────── */

function TemplatesTab({
  me,
  canWrite,
  onTemplates,
  onPreferences,
  onError,
}: {
  me: Me;
  canWrite: boolean;
  onTemplates: (templates: Template[]) => void;
  onPreferences: (preferences: SerializedPreferences) => void;
  onError: (message: string | null) => void;
}) {
  const [editing, setEditing] = useState<Template | "new" | null>(null);

  async function makeDefault(template: Template) {
    onError(null);
    try {
      const payload = await api<{ preferences: SerializedPreferences }>("/api/preferences", { method: "PATCH", json: { defaultEntryTemplate: template.id } });
      onPreferences(payload.preferences);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not change your default template.");
    }
  }

  async function archive(template: Template) {
    if (!window.confirm("Remove “" + template.name + "”? Pages already written with it keep their answers.")) return;
    onError(null);
    try {
      await api("/api/templates/" + template.id, { method: "DELETE" });
      onTemplates(me.templates.filter((item) => item.id !== template.id));
      if (me.preferences.defaultEntryTemplate === template.id) onPreferences({ ...me.preferences, defaultEntryTemplate: "sys:quick" });
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not remove this template.");
    }
  }

  if (editing) {
    return (
      <TemplateEditor
        template={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(saved) => {
          onTemplates(editing === "new" ? [...me.templates, saved] : me.templates.map((item) => (item.id === saved.id ? saved : item)));
          setEditing(null);
        }}
      />
    );
  }

  const canManage = (template: Template) =>
    canWrite && !template.system && (template.createdById === me.user.id || me.workspace.role === "OWNER" || me.workspace.role === "ADMIN");

  return (
    <>
      <header className="studio-page-head">
        <h3>Entry templates</h3>
        <p>Templates are starting points, not rules — on any page you can skip a question or add your own. The starred template opens by default.</p>
      </header>
      <div className="template-list">
        {me.templates.map((template) => {
          const isDefault = me.preferences.defaultEntryTemplate === template.id;
          return (
            <div key={template.id} className={"template-row " + (isDefault ? "default" : "")}>
              <span className="template-icon">{template.icon}</span>
              <div className="template-row-text">
                <strong>{template.name} {!template.system && <em>yours</em>}</strong>
                <small>{template.description || template.prompts.map((prompt) => prompt.label).join(" · ") || "Just the dream."}</small>
                {template.prompts.length > 0 && <span className="template-count">{template.prompts.length} question{template.prompts.length === 1 ? "" : "s"}</span>}
              </div>
              <div className="template-row-actions">
                <button type="button" className={isDefault ? "starred" : ""} onClick={() => void makeDefault(template)} aria-label={isDefault ? "Default template" : "Make default"} title={isDefault ? "Opens by default" : "Open this by default"}>
                  <Star size={14} fill={isDefault ? "currentColor" : "none"} />
                </button>
                {canManage(template) && (
                  <>
                    <button type="button" onClick={() => setEditing(template)} aria-label={"Edit " + template.name}><Pencil size={14} /></button>
                    <button type="button" onClick={() => void archive(template)} aria-label={"Remove " + template.name}><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {canWrite && (
        <button type="button" className="add-template" onClick={() => setEditing("new")}>
          <Plus size={15} /> Design a new template
          <small>{me.templates.filter((item) => !item.system).length} of {me.plan.limits.customEntryTemplates} custom templates used</small>
        </button>
      )}
    </>
  );
}

/* ───────────────────────── You ───────────────────────── */

function ProfileTab({
  me,
  onPreferences,
  onError,
}: {
  me: Me;
  onPreferences: (preferences: SerializedPreferences) => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState(me.preferences.displayName ?? me.user.name ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    onError(null);
    try {
      const payload = await api<{ preferences: SerializedPreferences }>("/api/preferences", { method: "PATCH", json: { displayName: name.trim() || null } });
      onPreferences(payload.preferences);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not save your name.");
    }
  }

  return (
    <>
      <header className="studio-page-head">
        <h3>You</h3>
        <p>How Tardemah greets you{me.workspace.isPersonal ? "" : " and how other members of " + me.workspace.name + " see you"}.</p>
      </header>
      <label className="text-control">
        <span className="control-label">Your name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={60} />
      </label>
      <div className="editor-actions">
        <a className="ghost-button" href="/account">Account, books & export →</a>
        <button type="button" className="pill-button" onClick={() => void save()}>{saved ? "Saved ✓" : "Save name"}</button>
      </div>
    </>
  );
}
