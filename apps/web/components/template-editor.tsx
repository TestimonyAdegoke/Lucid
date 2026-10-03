"use client";

import { moodOptions, type PromptKind, type TemplatePrompt } from "@tardemah/domain";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { api, type Template } from "@/lib/client";

const kinds: Array<{ id: PromptKind; label: string }> = [
  { id: "text", label: "Short answer" },
  { id: "longtext", label: "Paragraph" },
  { id: "scale", label: "1–10 scale" },
  { id: "choice", label: "Choice" },
  { id: "toggle", label: "Yes / no" },
];

const icons = ["✎", "☾", "✦", "◐", "☁", "∞", "⁂", "⌁", "❀", "☼", "♡", "✧"];

type DraftPrompt = TemplatePrompt & { key: string; optionsText?: string };

function toDraft(prompt: TemplatePrompt): DraftPrompt {
  return { ...prompt, key: crypto.randomUUID(), optionsText: prompt.options?.join(", ") };
}

export function TemplateEditor({
  template,
  onSaved,
  onCancel,
}: {
  template: Template | null;
  onSaved: (template: Template) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [icon, setIcon] = useState(template?.icon ?? "✎");
  const [prompts, setPrompts] = useState<DraftPrompt[]>(
    template?.prompts.map(toDraft) ?? [toDraft({ id: "", label: "", kind: "text" })],
  );
  const [mood, setMood] = useState(template?.defaults.mood ?? "");
  const [tags, setTags] = useState((template?.defaults.tags ?? []).join(", "));
  const [isLucid, setIsLucid] = useState(Boolean(template?.defaults.isLucid));
  const [isNightmare, setIsNightmare] = useState(Boolean(template?.defaults.isNightmare));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, patch: Partial<DraftPrompt>) {
    setPrompts((current) => current.map((prompt) => (prompt.key === key ? { ...prompt, ...patch } : prompt)));
  }

  function move(index: number, delta: number) {
    setPrompts((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    if (!name.trim()) {
      setError("Give your template a name.");
      return;
    }
    setSaving(true);
    setError(null);

    const body = {
      name,
      description,
      icon,
      prompts: prompts
        .filter((prompt) => prompt.label.trim())
        .map((prompt) => ({
          id: prompt.id || undefined,
          label: prompt.label,
          kind: prompt.kind,
          placeholder: prompt.placeholder,
          options: prompt.kind === "choice" ? (prompt.optionsText ?? "").split(",").map((option) => option.trim()).filter(Boolean) : undefined,
        })),
      defaults: {
        mood: mood || undefined,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        isLucid: isLucid || undefined,
        isNightmare: isNightmare || undefined,
      },
    };

    try {
      const payload = template
        ? await api<{ template: Template }>("/api/templates/" + template.id, { method: "PATCH", json: body })
        : await api<{ template: Template }>("/api/templates", { method: "POST", json: body });
      onSaved(payload.template);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not save this template.");
      setSaving(false);
    }
  }

  return (
    <div className="template-editor">
      <div className="template-editor-head">
        <div className="icon-picker" role="radiogroup" aria-label="Template icon">
          {icons.map((option) => (
            <button key={option} type="button" role="radio" aria-checked={icon === option} className={icon === option ? "selected" : ""} onClick={() => setIcon(option)}>{option}</button>
          ))}
        </div>
        <input className="title-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name, e.g. “Dream circle check-in”" aria-label="Template name" />
        <input className="soft-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A one-line description (optional)" aria-label="Description" />
      </div>

      <span className="studio-label">Prompts</span>
      <div className="prompt-list">
        {prompts.map((prompt, index) => (
          <div key={prompt.key} className="prompt-row">
            <div className="prompt-row-main">
              <input value={prompt.label} onChange={(event) => update(prompt.key, { label: event.target.value })} placeholder="Ask yourself something…" aria-label="Prompt" />
              <select value={prompt.kind} onChange={(event) => update(prompt.key, { kind: event.target.value as PromptKind })} aria-label="Answer type">
                {kinds.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
              </select>
            </div>
            {prompt.kind === "choice" && (
              <input className="soft-input" value={prompt.optionsText ?? ""} onChange={(event) => update(prompt.key, { optionsText: event.target.value })} placeholder="Options, separated by commas" aria-label="Options" />
            )}
            {(prompt.kind === "text" || prompt.kind === "longtext") && (
              <input className="soft-input" value={prompt.placeholder ?? ""} onChange={(event) => update(prompt.key, { placeholder: event.target.value })} placeholder="Example answer shown faintly (optional)" aria-label="Placeholder" />
            )}
            <div className="prompt-row-tools">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === prompts.length - 1} aria-label="Move down"><ArrowDown size={13} /></button>
              <button type="button" onClick={() => setPrompts((current) => current.filter((item) => item.key !== prompt.key))} aria-label="Remove prompt"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {prompts.length < 12 && (
          <button type="button" className="add-prompt" onClick={() => setPrompts((current) => [...current, toDraft({ id: "", label: "", kind: "text" })])}>
            <Plus size={14} /> Add a prompt
          </button>
        )}
      </div>

      <span className="studio-label">When this template is used</span>
      <div className="template-defaults">
        <label>
          <span>Start with mood</span>
          <select value={mood} onChange={(event) => setMood(event.target.value)}>
            <option value="">— no default —</option>
            {moodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Add tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="circle, check-in" />
        </label>
        <div className="dream-flags">
          <button type="button" className={isLucid ? "selected" : ""} onClick={() => setIsLucid((value) => !value)}>☾ Mark lucid</button>
          <button type="button" className={isNightmare ? "selected" : ""} onClick={() => setIsNightmare((value) => !value)}>☁ Mark nightmare</button>
        </div>
      </div>

      {error && <div className="editor-error" role="alert">{error}</div>}

      <div className="editor-actions">
        <button type="button" className="ghost-button" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="button" className="save-page compact" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : template ? "Save template" : "Create template"}
        </button>
      </div>
    </div>
  );
}
