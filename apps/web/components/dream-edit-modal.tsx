"use client";

import { moodOptions, type FieldValues, type TemplatePrompt } from "@tardemah/domain";
import { Heart, Star, Trash2, Users, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { AddQuestion } from "@/components/question-builder";
import { TagInput } from "@/components/tag-input";
import { TemplateFields } from "@/components/template-fields";
import { api, type Dream } from "@/lib/client";
import { useEscape } from "@/lib/use-escape";

function dateInputValue(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function DreamEditModal({
  dream,
  sharedBookName,
  onClose,
  onSaved,
  onDeleted,
}: {
  dream: Dream;
  sharedBookName: string | null;
  onClose: () => void;
  onSaved: (dream: Dream) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(dream.title);
  const [body, setBody] = useState(dream.content);
  const [mood, setMood] = useState(dream.mood ?? "");
  const [tags, setTags] = useState<string[]>(dream.tags);
  const [prompts, setPrompts] = useState<TemplatePrompt[]>(dream.fields?.prompts ?? []);
  const promptsChanged = JSON.stringify(prompts) !== JSON.stringify(dream.fields?.prompts ?? []);
  const [date, setDate] = useState(dateInputValue(dream.dreamedAt));
  const [fields, setFields] = useState<FieldValues>(dream.fields?.values ?? {});
  const [vividness, setVividness] = useState(dream.vividness ?? 5);
  const [isLucid, setIsLucid] = useState(dream.isLucid);
  const [isNightmare, setIsNightmare] = useState(dream.isNightmare);
  const [isFavorite, setIsFavorite] = useState(dream.isFavorite);
  const [shared, setShared] = useState(dream.visibility === "WORKSPACE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEscape(onClose, saving);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);

    const originalDay = dateInputValue(dream.dreamedAt);
    try {
      const payload = await api<{ dream: Dream }>("/api/dreams/" + dream.id, {
        method: "PATCH",
        json: {
          title,
          content: body,
          mood,
          tags,
          prompts: promptsChanged ? prompts : undefined,
          fields: dream.fields || promptsChanged ? fields : undefined,
          dreamedAt: date !== originalDay ? new Date(date + "T04:00:00").toISOString() : undefined,
          vividness,
          isLucid,
          isNightmare,
          isFavorite,
          visibility: sharedBookName ? (shared ? "WORKSPACE" : "PRIVATE") : undefined,
        },
      });
      onSaved(payload.dream);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not update this page.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (saving || !window.confirm("Remove this dream from your journal? This cannot be undone.")) return;
    setSaving(true);
    setError(null);

    try {
      await api("/api/dreams/" + dream.id, { method: "DELETE" });
      onDeleted(dream.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not remove this page.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && onClose()}>
      <form className="composer paper-modal paper-surface edit-dream-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()} aria-label="Edit dream">
        <button type="button" className="modal-close" disabled={saving} onClick={onClose} aria-label="Close"><X size={18} /></button>
        <p className="eyebrow">Edit dream page{dream.fields ? " · " + dream.fields.template.name : ""}</p>
        <h2>Keep the memory true to you.</h2>
        <p className="modal-intro">Add details you remembered later, or tidy the page without changing what happened.</p>

        <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dream title" aria-label="Title" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} aria-label="Dream" />

        <section className="questions">
          <TemplateFields
            prompts={prompts}
            values={fields}
            onChange={setFields}
            onRemove={(id) => {
              setPrompts((current) => current.filter((prompt) => prompt.id !== id));
              setFields((current) => { const next = { ...current }; delete next[id]; return next; });
            }}
          />
          <div className="questions-actions">
            <AddQuestion existing={prompts} onAdd={(prompt) => setPrompts((current) => [...current, prompt])} />
          </div>
        </section>

        <label className="editor-field">
          <span>The night of</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>

        <div className="detail-block">
          <span className="detail-label">I woke up feeling</span>
          <div className="chip-row">
            {moodOptions.map((option) => (
              <button key={option} type="button" className={mood === option ? "selected" : ""} onClick={() => setMood(mood === option ? "" : option)}>{option}</button>
            ))}
            <input className="chip-input" value={moodOptions.includes(mood) ? "" : mood} onChange={(event) => setMood(event.target.value.slice(0, 50))} placeholder="or in your words…" aria-label="Your own feeling" />
          </div>
        </div>

        <div className="detail-block">
          <span className="detail-label">Little things to remember</span>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <label className="vividness-field">
          <span>How vivid was it? <strong>{vividness}/10</strong></span>
          <input type="range" min="1" max="10" value={vividness} onChange={(event) => setVividness(Number(event.target.value))} />
        </label>

        <div className="chip-row flags">
          <button type="button" className={isLucid ? "selected" : ""} onClick={() => setIsLucid((value) => !value)}>☾ I knew I was dreaming</button>
          <button type="button" className={isNightmare ? "selected" : ""} onClick={() => setIsNightmare((value) => !value)}>☁ It felt like a nightmare</button>
          <button type="button" className={isFavorite ? "selected" : ""} onClick={() => setIsFavorite((value) => !value)}>
            <Star size={13} fill={isFavorite ? "currentColor" : "none"} /> Keep close
          </button>
        </div>

        {sharedBookName && (
          <label className="share-toggle">
            <input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} />
            <span className="share-switch" />
            <span><Users size={14} /> Share with <strong>{sharedBookName}</strong><small>{shared ? "Members can read it." : "Only you can see it."}</small></span>
          </label>
        )}

        {error && <div className="editor-error" role="alert">{error}</div>}

        <div className="editor-actions">
          <button className="delete-page" type="button" onClick={remove} disabled={saving}><Trash2 size={15} /> Remove page</button>
          <button className="save-page compact" type="submit" disabled={!body.trim() || saving}>
            {saving ? "Saving…" : "Save changes"} <Heart size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
