"use client";

import type { FieldValue, FieldValues, TemplatePrompt } from "@tardemah/domain";
import { RemoveQuestion } from "@/components/question-builder";

export function TemplateFields({
  prompts,
  values,
  onChange,
  onRemove,
}: {
  prompts: TemplatePrompt[];
  values: FieldValues;
  onChange: (next: FieldValues) => void;
  /** When provided, each question can be skipped for this page. */
  onRemove?: (id: string) => void;
}) {
  if (!prompts.length) return null;

  function set(id: string, value: FieldValue | undefined) {
    const next = { ...values };
    if (value === undefined || value === "") delete next[id];
    else next[id] = value;
    onChange(next);
  }

  return (
    <div className="template-fields">
      {prompts.map((prompt) => {
        const value = values[prompt.id];
        return (
          <div key={prompt.id} className={"template-field kind-" + prompt.kind}>
            <span className="template-field-label">
              {prompt.label}
              {onRemove && <RemoveQuestion label={prompt.label} onRemove={() => onRemove(prompt.id)} />}
            </span>

            {prompt.kind === "text" && (
              <input value={typeof value === "string" ? value : ""} placeholder={prompt.placeholder} onChange={(event) => set(prompt.id, event.target.value)} aria-label={prompt.label} />
            )}

            {prompt.kind === "longtext" && (
              <textarea rows={3} value={typeof value === "string" ? value : ""} placeholder={prompt.placeholder} onChange={(event) => set(prompt.id, event.target.value)} aria-label={prompt.label} />
            )}

            {prompt.kind === "scale" && (
              <div className="scale-picker" role="radiogroup" aria-label={prompt.label}>
                {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
                  <button
                    key={step}
                    type="button"
                    role="radio"
                    aria-checked={value === step}
                    className={typeof value === "number" && step <= value ? "filled" : ""}
                    onClick={() => set(prompt.id, value === step ? undefined : step)}
                  >
                    {step}
                  </button>
                ))}
              </div>
            )}

            {prompt.kind === "choice" && (
              <div className="choice-picker">
                {prompt.options?.map((option) => (
                  <button key={option} type="button" className={value === option ? "selected" : ""} onClick={() => set(prompt.id, value === option ? undefined : option)}>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {prompt.kind === "toggle" && (
              <div className="choice-picker">
                <button type="button" className={value === true ? "selected" : ""} onClick={() => set(prompt.id, value === true ? undefined : true)}>Yes</button>
                <button type="button" className={value === false ? "selected" : ""} onClick={() => set(prompt.id, value === false ? undefined : false)}>No</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FieldAnswers({ prompts, values, title }: { prompts: TemplatePrompt[]; values: FieldValues; title: string }) {
  const answered = prompts.filter((prompt) => values[prompt.id] !== undefined);
  if (!answered.length) return null;

  return (
    <section className="field-answers">
      <span className="field-answers-title">{title}</span>
      <dl>
        {answered.map((prompt) => {
          const value = values[prompt.id];
          return (
            <div key={prompt.id}>
              <dt>{prompt.label}</dt>
              <dd>
                {prompt.kind === "scale" && typeof value === "number" ? (
                  <span className="scale-dots" aria-label={value + " out of 10"}>
                    {Array.from({ length: 10 }, (_, index) => <i key={index} className={index < value ? "on" : ""} />)}
                    <small>{value}/10</small>
                  </span>
                ) : prompt.kind === "toggle" ? (value ? "Yes" : "No") : String(value)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
