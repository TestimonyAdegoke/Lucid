"use client";

import { Heart, Star, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export type EditableDream = {
  id: string;
  clientId: string | null;
  title: string;
  body: string;
  dreamedAt: string;
  mood: string;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
};

type ApiDream = {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string | null;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
};

function mapDream(dream: ApiDream): EditableDream {
  return {
    id: dream.id,
    clientId: dream.clientId,
    title: dream.title,
    body: dream.content,
    dreamedAt: dream.dreamedAt,
    mood: dream.mood ?? "unspoken",
    tags: dream.tags,
    vividness: dream.vividness,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
  };
}

const moods = ["peaceful", "happy", "curious", "nostalgic", "anxious", "strange"];

export function DreamEditModal({
  dream,
  onClose,
  onSaved,
  onDeleted,
}: {
  dream: EditableDream;
  onClose: () => void;
  onSaved: (dream: EditableDream) => void;
  onDeleted: (id: string) => void;
}) {
  const [title, setTitle] = useState(dream.title);
  const [body, setBody] = useState(dream.body);
  const [mood, setMood] = useState(dream.mood);
  const [tags, setTags] = useState(dream.tags.join(", "));
  const [vividness, setVividness] = useState(dream.vividness ?? 5);
  const [isLucid, setIsLucid] = useState(dream.isLucid);
  const [isNightmare, setIsNightmare] = useState(dream.isNightmare);
  const [isFavorite, setIsFavorite] = useState(dream.isFavorite);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(dream.title);
    setBody(dream.body);
    setMood(dream.mood);
    setTags(dream.tags.join(", "));
    setVividness(dream.vividness ?? 5);
    setIsLucid(dream.isLucid);
    setIsNightmare(dream.isNightmare);
    setIsFavorite(dream.isFavorite);
  }, [dream]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/dreams/" + dream.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: body,
          mood,
          tags: tags.split(","),
          vividness,
          isLucid,
          isNightmare,
          isFavorite,
        }),
      });

      if (!response.ok) throw new Error("save-failed");
      const payload = (await response.json()) as { dream: ApiDream };
      onSaved(mapDream(payload.dream));
      onClose();
    } catch {
      setError("Lucid could not update this page.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (saving || !window.confirm("Remove this dream from your journal? This cannot be undone.")) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/dreams/" + dream.id, { method: "DELETE" });
      if (!response.ok) throw new Error("delete-failed");
      onDeleted(dream.id);
      onClose();
    } catch {
      setError("Lucid could not remove this page.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && onClose()}>
      <form className="composer paper-modal edit-dream-modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" disabled={saving} onClick={onClose}><X size={18} /></button>
        <p className="eyebrow">Edit dream page</p>
        <h2>Keep the memory true to you.</h2>
        <p className="modal-intro">Add details you remembered later, or tidy the page without changing what happened.</p>

        <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dream title" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} />

        <div className="mood-picker">
          <span>I woke up feeling</span>
          <div>
            {moods.map((option) => (
              <button key={option} type="button" className={mood === option ? "selected" : ""} onClick={() => setMood(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="editor-field">
          <span>Little things I want to remember</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="water, school, flying, mum..." />
          <small>Separate tags with commas.</small>
        </label>

        <label className="vividness-field">
          <span>How vivid was it? <strong>{vividness}/10</strong></span>
          <input type="range" min="1" max="10" value={vividness} onChange={(event) => setVividness(Number(event.target.value))} />
        </label>

        <div className="dream-flags">
          <button type="button" className={isLucid ? "selected" : ""} onClick={() => setIsLucid((value) => !value)}>☾ I knew I was dreaming</button>
          <button type="button" className={isNightmare ? "selected" : ""} onClick={() => setIsNightmare((value) => !value)}>☁ It felt like a nightmare</button>
          <button type="button" className={isFavorite ? "selected" : ""} onClick={() => setIsFavorite((value) => !value)}>
            <Star size={13} fill={isFavorite ? "currentColor" : "none"} /> Keep close
          </button>
        </div>

        {error && <div className="editor-error">{error}</div>}

        <div className="editor-actions">
          <button className="delete-page" type="button" onClick={remove} disabled={saving}><Trash2 size={15} /> Remove page</button>
          <button className="save-page compact" type="submit" disabled={!body.trim() || saving}>
            {saving ? "Saving..." : "Save changes"} <Heart size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
