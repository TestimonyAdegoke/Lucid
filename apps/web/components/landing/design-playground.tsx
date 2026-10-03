"use client";

import {
  covers,
  defaultAppearance,
  emblems,
  fonts,
  palettes,
  papers,
  typographies,
  type Appearance,
} from "@tardemah/domain";
import { useState } from "react";
import { Emblem } from "@/components/brand";
import { JournalPreview } from "@/components/journal-preview";

const featuredPalettes = ["lavender", "rose", "sage", "tidepool", "ember", "graphite", "midnight", "velvet"];
const featuredInks = ["#8f78b8", "#c0603f", "#2f6f6a", "#b8893a", "#3b5ba5", "#a2456b"];

/** A hands-on taste of the Design Studio: visitors bind their own book before signing up. */
export function DesignPlayground() {
  const [appearance, setAppearance] = useState<Appearance>({ ...defaultAppearance, theme: "rose", typography: "classic", cover: "botanical", paper: "parchment", emblem: "flower", ornamentSet: "botanical", bookTitle: "Night Garden" });

  function set(patch: Partial<Appearance>) {
    setAppearance((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="playground">
      <div className="playground-stage">
        <JournalPreview appearance={appearance} size="xl" title="Grandmother's garden" body="Tomatoes as big as lanterns. She handed me a key and said I would know which door when I saw it…" tag="family" />
      </div>

      <div className="playground-controls">
        <div className="pg-row">
          <span className="pg-label">Palette</span>
          <div className="pg-swatches">
            {palettes.filter((palette) => featuredPalettes.includes(palette.id)).map((palette) => (
              <button
                key={palette.id}
                type="button"
                className={appearance.theme === palette.id && !appearance.accentColor ? "active" : ""}
                style={{ background: `linear-gradient(135deg, ${palette.tokens.paper} 0 42%, ${palette.tokens.accent} 42% 70%, ${palette.tokens.coverDeep} 70%)` }}
                onClick={() => set({ theme: palette.id, accentColor: null })}
                aria-label={palette.name}
                title={palette.name}
              />
            ))}
          </div>
        </div>

        <div className="pg-row">
          <span className="pg-label">Ink</span>
          <div className="pg-inks">
            {featuredInks.map((ink) => (
              <button key={ink} type="button" className={appearance.accentColor === ink ? "active" : ""} style={{ background: ink }} onClick={() => set({ accentColor: ink })} aria-label={"Ink " + ink} />
            ))}
            <label className="pg-ink-custom" title="Any colour you like">
              <input type="color" value={appearance.accentColor ?? "#8f78b8"} onChange={(event) => set({ accentColor: event.target.value })} aria-label="Choose any ink colour" />
              <span>+</span>
            </label>
          </div>
        </div>

        <div className="pg-row">
          <span className="pg-label">Lettering</span>
          <div className="pg-chips">
            {typographies.map((type) => (
              <button key={type.id} type="button" className={appearance.typography === type.id ? "active" : ""} onClick={() => set({ typography: type.id })} style={{ fontFamily: fonts.find((font) => font.id === type.heading)?.stack }}>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pg-row two">
          <div>
            <span className="pg-label">Paper</span>
            <div className="pg-chips">
              {papers.map((paper) => (
                <button key={paper.id} type="button" className={appearance.paper === paper.id ? "active" : ""} onClick={() => set({ paper: paper.id })}>{paper.name}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="pg-label">Cover</span>
            <div className="pg-chips">
              {covers.map((cover) => (
                <button key={cover.id} type="button" className={appearance.cover === cover.id ? "active" : ""} onClick={() => set({ cover: cover.id })}>{cover.name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="pg-row">
          <span className="pg-label">Name & mark</span>
          <div className="pg-name">
            <input value={appearance.bookTitle ?? ""} onChange={(event) => set({ bookTitle: event.target.value.slice(0, 32) || null })} placeholder="Name your book" aria-label="Book title" />
            <div className="pg-emblems">
              {emblems.filter((emblem) => emblem.id !== "none").map((emblem) => (
                <button key={emblem.id} type="button" className={appearance.emblem === emblem.id ? "active" : ""} onClick={() => set({ emblem: emblem.id })} aria-label={emblem.name} title={emblem.name}>
                  <Emblem emblem={emblem.id} size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
