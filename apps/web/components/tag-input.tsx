"use client";

import { X } from "lucide-react";
import { useState } from "react";

function clean(value: string) {
  return value.trim().toLowerCase().replace(/^#/, "").slice(0, 40);
}

/** Tags as removable chips; Enter, comma or Tab adds the typed tag. */
export function TagInput({ tags, onChange, max = 20 }: { tags: string[]; onChange: (tags: string[]) => void; max?: number }) {
  const [text, setText] = useState("");

  function commit(value = text) {
    const parts = value.split(",").map(clean).filter(Boolean);
    if (parts.length) onChange([...new Set([...tags, ...parts])].slice(0, max));
    setText("");
  }

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          #{tag}
          <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} aria-label={"Remove " + tag}><X size={11} /></button>
        </span>
      ))}
      <input
        value={text}
        onChange={(event) => {
          const value = event.target.value;
          if (value.includes(",")) commit(value);
          else setText(value);
        }}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === "Tab") && text.trim()) {
            event.preventDefault();
            commit();
          } else if (event.key === "Backspace" && !text && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => commit()}
        placeholder={tags.length ? "add another…" : "water, school, flying, mum…"}
        aria-label="Add a tag"
      />
    </div>
  );
}
