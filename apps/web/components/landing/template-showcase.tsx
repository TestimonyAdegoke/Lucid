"use client";

import type { EntryTemplate, TemplatePrompt } from "@tardemah/domain";
import { Plus } from "lucide-react";
import { useState } from "react";

const CUSTOM: EntryTemplate = {
  id: "custom",
  name: "Entirely your own",
  icon: "✎",
  description: "Your questions, in your order — for a practice, a study or a circle.",
  system: false,
  defaults: {},
  prompts: [
    { id: "c1", label: "Did I fly tonight?", kind: "toggle" },
    { id: "c2", label: "How vivid were the colours?", kind: "scale" },
    { id: "c3", label: "Which card did I draw before sleep?", kind: "text", placeholder: "The Moon" },
  ],
};

function PromptField({ prompt }: { prompt: TemplatePrompt }) {
  switch (prompt.kind) {
    case "scale":
      return (
        <span className="tp-scale" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < 7 ? "on" : ""} />)}
        </span>
      );
    case "choice":
      return (
        <span className="tp-chips" aria-hidden="true">
          {(prompt.options ?? []).slice(0, 4).map((option, i) => <i key={option} className={i === 0 ? "on" : ""}>{option}</i>)}
        </span>
      );
    case "toggle":
      return <span className="tp-toggle" aria-hidden="true"><i /></span>;
    case "longtext":
      return <span className="tp-lines two" aria-hidden="true">{prompt.placeholder && <em>{prompt.placeholder}</em>}</span>;
    default:
      return <span className="tp-lines" aria-hidden="true">{prompt.placeholder && <em>{prompt.placeholder}</em>}</span>;
  }
}

/** Templates as a book's contents page: pick one on the left, see the page it makes on the right. */
export function TemplateShowcase({ templates }: { templates: EntryTemplate[] }) {
  const all = [...templates, CUSTOM];
  const [activeId, setActiveId] = useState(all[1]?.id ?? all[0].id);
  const active = all.find((t) => t.id === activeId) ?? all[0];

  return (
    <div className="tp">
      <ol className="tp-index" aria-label="Entry templates">
        {all.map((template, index) => (
          <li key={template.id}>
            <button
              type="button"
              className={template.id === active.id ? "active" : ""}
              aria-pressed={template.id === active.id}
              onClick={() => setActiveId(template.id)}
            >
              <span className="tp-num">{String(index + 1).padStart(2, "0")}</span>
              <span className="tp-name">{template.name}</span>
              <span className="tp-glyph" aria-hidden="true">{template.icon}</span>
            </button>
          </li>
        ))}
      </ol>

      <article className="tp-page" aria-live="polite">
        <header className="tp-page-head">
          <span>{active.name}</span>
          <span>Night of Oct 2</span>
        </header>
        <p className="tp-desc">{active.description}</p>

        <div className="tp-body" key={active.id}>
          <div className="tp-prompt">
            <span className="tp-label">The dream</span>
            <span className="tp-lines two"><em>I was back in the house by the sea…</em></span>
          </div>
          {active.prompts.slice(0, 4).map((prompt) => (
            <div className="tp-prompt" key={prompt.id}>
              <span className="tp-label">{prompt.label}<small>skip</small></span>
              <PromptField prompt={prompt} />
            </div>
          ))}
        </div>

        <span className="tp-add"><Plus size={13} /> Ask yourself something else</span>
      </article>
    </div>
  );
}
