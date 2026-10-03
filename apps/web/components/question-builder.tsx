"use client";

import type { PromptKind, TemplatePrompt } from "@tardemah/domain";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export const promptKinds: Array<{ id: PromptKind; label: string }> = [
  { id: "text", label: "Short answer" },
  { id: "longtext", label: "Paragraph" },
  { id: "scale", label: "1–10 scale" },
  { id: "choice", label: "Choice" },
  { id: "toggle", label: "Yes / no" },
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "question";
}

/** Inline "add your own question" control used by the composer and the page editor. */
export function AddQuestion({ existing, onAdd }: { existing: TemplatePrompt[]; onAdd: (prompt: TemplatePrompt) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<PromptKind>("text");
  const [options, setOptions] = useState("");

  function add() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const choices = options.split(",").map((option) => option.trim()).filter(Boolean);
    if (kind === "choice" && choices.length < 2) return;

    let id = slug(trimmed);
    while (existing.some((prompt) => prompt.id === id)) id += "-2";
    onAdd({ id, label: trimmed, kind, ...(kind === "choice" ? { options: choices.slice(0, 10) } : {}) });
    setLabel("");
    setOptions("");
    setKind("text");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className="add-question" onClick={() => setOpen(true)} disabled={existing.length >= 12}>
        <Plus size={14} /> Ask yourself something else
      </button>
    );
  }

  const choiceInvalid = kind === "choice" && options.split(",").filter((option) => option.trim()).length < 2;

  return (
    <div className="add-question-form">
      <input
        autoFocus
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          }
        }}
        placeholder="e.g. What was the light like?"
        aria-label="Your question"
        maxLength={140}
      />
      <div className="kind-row" role="radiogroup" aria-label="Answer type">
        {promptKinds.map((option) => (
          <button key={option.id} type="button" role="radio" aria-checked={kind === option.id} className={kind === option.id ? "selected" : ""} onClick={() => setKind(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      {kind === "choice" && (
        <input value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Options, separated by commas" aria-label="Options" />
      )}
      <div className="add-question-actions">
        <button type="button" className="text-button" onClick={() => setOpen(false)}>Cancel</button>
        <button type="button" className="pill-button" onClick={add} disabled={!label.trim() || choiceInvalid}>Add question</button>
      </div>
    </div>
  );
}

export function RemoveQuestion({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className="question-remove" onClick={onRemove} aria-label={"Skip “" + label + "” on this page"} title="Skip this question">
      <X size={13} />
    </button>
  );
}
