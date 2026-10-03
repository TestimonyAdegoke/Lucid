"use client";

import { moodOptions, type FieldValues, type TemplatePrompt } from "@tardemah/domain";
import { BookmarkPlus, ChevronDown, Feather, Users, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AddQuestion } from "@/components/question-builder";
import { TagInput } from "@/components/tag-input";
import { TemplateFields } from "@/components/template-fields";
import { VoiceCapture } from "@/components/voice-capture";
import { api, type Dream, type Me, type Template } from "@/lib/client";
import { useEscape } from "@/lib/use-escape";

const promptCopy = {
  gentle: { eyebrow: "A new page", heading: "What do you remember?", intro: "Fragments count. You don't have to make it make sense yet.", placeholder: "I was somewhere…" },
  minimal: { eyebrow: "A new page", heading: "Last night", intro: "", placeholder: "Write the dream…" },
  reflective: { eyebrow: "A new page", heading: "Where did you go last night?", intro: "Write what happened, then notice what it stirred. Tardemah won't tell you what it means.", placeholder: "It began…" },
} as const;

type When = "last-night" | "nap" | "other";

type Draft = { templateId: string; title: string; body: string; fields: FieldValues; tags: string[]; prompts: TemplatePrompt[] };

const DRAFT_PREFIX = "tardemah.draft.";

function morningOf(date: Date) {
  const value = new Date(date);
  value.setHours(4, 0, 0, 0);
  return value;
}

function todayInputValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function samePrompts(a: TemplatePrompt[], b: TemplatePrompt[]) {
  return a.length === b.length && a.every((prompt, index) => prompt.id === b[index].id && prompt.label === b[index].label);
}

export function Composer({
  me,
  initialTemplateId,
  onClose,
  onSaved,
  onMe,
}: {
  me: Me;
  initialTemplateId?: string;
  onClose: () => void;
  onSaved: (dream: Dream) => void;
  onMe: (me: Me) => void;
}) {
  const draftKey = DRAFT_PREFIX + me.workspace.id;
  const copy = promptCopy[me.preferences.appearance.promptStyle as keyof typeof promptCopy] ?? promptCopy.gentle;
  const isShared = !me.workspace.isPersonal;

  const [templateId, setTemplateId] = useState(initialTemplateId ?? me.preferences.defaultEntryTemplate);
  const template = useMemo(
    () => me.templates.find((item) => item.id === templateId) ?? me.templates[0],
    [me.templates, templateId],
  );

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [prompts, setPrompts] = useState<TemplatePrompt[]>(template.prompts);
  const [fields, setFields] = useState<FieldValues>({});
  const [mood, setMood] = useState(template.defaults.mood ?? "");
  const [customMood, setCustomMood] = useState(false);
  const [tags, setTags] = useState<string[]>(template.defaults.tags ?? []);
  const [when, setWhen] = useState<When>("last-night");
  const [otherDate, setOtherDate] = useState(todayInputValue());
  const [vividness, setVividness] = useState<number | null>(null);
  const [isLucid, setIsLucid] = useState(Boolean(template.defaults.isLucid));
  const [isNightmare, setIsNightmare] = useState(Boolean(template.defaults.isNightmare));
  const [shared, setShared] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateSaved, setTemplateSaved] = useState(false);
  useEscape(onClose, saving);

  const customized = !samePrompts(prompts, template.prompts);
  const canSaveTemplate = prompts.length > 0 && customized && me.workspace.role !== "VIEWER";

  // Restore an unsaved draft for this dream book.
  useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) ?? "null") as Draft | null;
      if (draft && (draft.body || draft.title || Object.keys(draft.fields ?? {}).length)) {
        if (!initialTemplateId && me.templates.some((item) => item.id === draft.templateId)) setTemplateId(draft.templateId);
        setTitle(draft.title);
        setBody(draft.body);
        setFields(draft.fields ?? {});
        if (Array.isArray(draft.tags)) setTags(draft.tags);
        if (Array.isArray(draft.prompts)) setPrompts(draft.prompts);
        setRestored(true);
      }
    } catch {
      // ignore unreadable drafts
    }
  }, [draftKey, initialTemplateId, me.templates]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft: Draft = { templateId, title, body, fields, tags, prompts };
        if (body || title || Object.keys(fields).length) window.localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // storage unavailable
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftKey, templateId, title, body, fields, tags, prompts]);

  function chooseTemplate(next: Template) {
    setTemplateId(next.id);
    setPrompts(next.prompts);
    setFields({});
    setTemplateSaved(false);
    if (next.defaults.mood) setMood(next.defaults.mood);
    setIsLucid(Boolean(next.defaults.isLucid));
    setIsNightmare(Boolean(next.defaults.isNightmare));
    setTags((current) => [...new Set([...current, ...(next.defaults.tags ?? [])])]);
  }

  function removePrompt(id: string) {
    setPrompts((current) => current.filter((prompt) => prompt.id !== id));
    setFields((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function dreamedAt() {
    if (when === "nap") return new Date();
    if (when === "other") return morningOf(new Date(otherDate + "T12:00:00"));
    return morningOf(new Date());
  }

  async function saveAsTemplate() {
    if (!templateName?.trim()) return;
    setError(null);
    try {
      const payload = await api<{ template: Template }>("/api/templates", {
        method: "POST",
        json: { name: templateName, icon: "✎", prompts, defaults: { tags, mood: mood || undefined, isLucid: isLucid || undefined, isNightmare: isNightmare || undefined } },
      });
      onMe({ ...me, templates: [...me.templates, payload.template] });
      setTemplateId(payload.template.id);
      setPrompts(payload.template.prompts);
      setTemplateName(null);
      setTemplateSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not save these questions as a template.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);

    try {
      const payload = await api<{ dream: Dream }>("/api/dreams", {
        method: "POST",
        json: {
          clientId: crypto.randomUUID(),
          templateId: template.id,
          prompts,
          title,
          content: body,
          fields,
          mood: mood || null,
          tags,
          dreamedAt: dreamedAt().toISOString(),
          vividness,
          isLucid,
          isNightmare,
          visibility: isShared && shared ? "WORKSPACE" : "PRIVATE",
        },
      });
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      onSaved(payload.dream);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This dream was not saved. Please try again.");
      setSaving(false);
    }
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setTitle("");
    setBody("");
    setFields({});
    setPrompts(template.prompts);
    setRestored(false);
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && onClose()}>
      <form className="composer paper-modal paper-surface" onSubmit={save} onMouseDown={(event) => event.stopPropagation()} aria-label="Write a dream">
        <button type="button" className="modal-close" disabled={saving} onClick={onClose} aria-label="Close"><X size={18} /></button>

        <header className="composer-head">
          <p className="eyebrow">{copy.eyebrow}{isShared ? " · " + me.workspace.name : ""}</p>
          <h2>{copy.heading}</h2>
          {copy.intro && <p className="modal-intro">{copy.intro}</p>}
        </header>

        <div className="template-strip" role="tablist" aria-label="Start from">
          {me.templates.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === template.id}
              className={item.id === template.id ? "selected" : ""}
              onClick={() => chooseTemplate(item)}
              title={item.description}
            >
              <span>{item.icon}</span>{item.name}
            </button>
          ))}
        </div>

        {restored && (
          <div className="draft-note">
            Your unfinished page was kept safe. <button type="button" onClick={discardDraft}>Start fresh</button>
          </div>
        )}

        <div className="writing-area">
          {me.features.voice && (
            <VoiceCapture onTranscript={(transcript) => setBody((current) => (current.trim() ? current.trim() + "\n\n" + transcript : transcript))} />
          )}
          <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A title, if one comes to you" aria-label="Title" />
          <textarea className="body-input" autoFocus value={body} onChange={(event) => setBody(event.target.value)} placeholder={copy.placeholder} rows={7} aria-label="Dream" />
        </div>

        <section className="questions">
          {(prompts.length > 0 || customized) && (
            <div className="questions-head">
              <span>{customized ? "Your questions for this page" : template.name}</span>
              {customized && template.prompts.length > 0 && (
                <button type="button" className="text-button" onClick={() => { setPrompts(template.prompts); setFields({}); }}>Reset to template</button>
              )}
            </div>
          )}
          <TemplateFields prompts={prompts} values={fields} onChange={setFields} onRemove={removePrompt} />
          <div className="questions-actions">
            <AddQuestion existing={prompts} onAdd={(prompt) => { setPrompts((current) => [...current, prompt]); setTemplateSaved(false); }} />
            {canSaveTemplate && !templateSaved && templateName === null && (
              <button type="button" className="text-button" onClick={() => setTemplateName("")}><BookmarkPlus size={14} /> Save as template</button>
            )}
            {templateSaved && <span className="saved-note">Saved to your templates ✓</span>}
          </div>
          {templateName !== null && (
            <div className="inline-save">
              <input autoFocus value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Name this template" maxLength={60} aria-label="Template name" />
              <button type="button" className="text-button" onClick={() => setTemplateName(null)}>Cancel</button>
              <button type="button" className="pill-button" onClick={() => void saveAsTemplate()} disabled={!templateName.trim()}>Save</button>
            </div>
          )}
        </section>

        <div className="detail-grid">
          <div className="detail-block">
            <span className="detail-label">When</span>
            <div className="chip-row">
              <button type="button" className={when === "last-night" ? "selected" : ""} onClick={() => setWhen("last-night")}>Last night</button>
              <button type="button" className={when === "nap" ? "selected" : ""} onClick={() => setWhen("nap")}>A nap today</button>
              <button type="button" className={when === "other" ? "selected" : ""} onClick={() => setWhen("other")}>Another night</button>
              {when === "other" && <input type="date" value={otherDate} max={todayInputValue()} onChange={(event) => setOtherDate(event.target.value)} aria-label="Night of the dream" />}
            </div>
          </div>

          <div className="detail-block">
            <span className="detail-label">I woke up feeling</span>
            <div className="chip-row">
              {moodOptions.map((option) => (
                <button key={option} type="button" className={!customMood && mood === option ? "selected" : ""} onClick={() => { setCustomMood(false); setMood(mood === option ? "" : option); }}>{option}</button>
              ))}
              {customMood ? (
                <input className="chip-input" autoFocus value={mood} onChange={(event) => setMood(event.target.value.slice(0, 50))} placeholder="in your words…" aria-label="Your own feeling" />
              ) : (
                <button type="button" className="chip-other" onClick={() => { setCustomMood(true); setMood(""); }}><Feather size={12} /> other…</button>
              )}
            </div>
          </div>

          <div className="detail-block">
            <span className="detail-label">Little things to remember</span>
            <TagInput tags={tags} onChange={setTags} />
          </div>
        </div>

        <button type="button" className="more-toggle" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>
          Vividness & dream type <ChevronDown size={14} />
        </button>

        {moreOpen && (
          <div className="more-details">
            <label className="vividness-field">
              <span>How vivid was it? <strong>{vividness ? vividness + "/10" : "—"}</strong></span>
              <input type="range" min="1" max="10" value={vividness ?? 5} onChange={(event) => setVividness(Number(event.target.value))} />
            </label>
            <div className="chip-row">
              <button type="button" className={isLucid ? "selected" : ""} onClick={() => setIsLucid((value) => !value)}>☾ I knew I was dreaming</button>
              <button type="button" className={isNightmare ? "selected" : ""} onClick={() => setIsNightmare((value) => !value)}>☁ It felt like a nightmare</button>
            </div>
          </div>
        )}

        {isShared && (
          <label className="share-toggle">
            <input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} />
            <span className="share-switch" />
            <span><Users size={14} /> Share this page with <strong>{me.workspace.name}</strong><small>{shared ? "Members can read it." : "Only you can see it."}</small></span>
          </label>
        )}

        {error && <div className="editor-error" role="alert">{error}</div>}

        <footer className="composer-foot">
          <span className="composer-hint">{words ? words + (words === 1 ? " word" : " words") : "Esc to close · your draft is kept"}</span>
          <button className="save-page" type="submit" disabled={!body.trim() || saving}>
            {saving ? "Keeping your dream…" : "Keep this dream"}
          </button>
        </footer>
      </form>
    </div>
  );
}
