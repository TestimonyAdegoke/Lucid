import {
  appearanceDataAttributes,
  appearanceToCssVars,
  ornamentGlyphs,
  type Appearance,
} from "@tardemah/domain";
import type { CSSProperties } from "react";
import { Emblem } from "@/components/brand";

/** Scoped style + data attributes so a preview renders a look independently of the page around it. */
export function appearanceScope(appearance: Appearance) {
  const data = appearanceDataAttributes(appearance);
  return {
    style: appearanceToCssVars(appearance) as CSSProperties,
    ...Object.fromEntries(Object.entries(data).map(([key, value]) => ["data-" + key, value])),
  };
}

/** A faithful miniature of the journal: cover, page edges, ribbon, bookplate and an open page. */
export function JournalPreview({
  appearance,
  title = "The house by the sea",
  body = "I was walking through a house I knew, except every door opened onto water. My sister was there, laughing somewhere upstairs…",
  tag = "water",
  size = "md",
  bookTitle,
}: {
  appearance: Appearance;
  title?: string;
  body?: string;
  tag?: string;
  size?: "sm" | "md" | "lg" | "xl";
  bookTitle?: string;
}) {
  const [corner, mark] = ornamentGlyphs(appearance);
  const name = appearance.bookTitle || bookTitle || "Dreams";

  return (
    <div className={"mini-book mini-" + size} {...appearanceScope(appearance)} aria-hidden="true">
      <div className="mini-cover cover-surface" />
      <div className="mini-edges" />
      <div className="mini-spread">
        <div className="mini-index paper-surface paper-deep">
          <span className="mini-plate">
            <Emblem emblem={appearance.emblem} size={10} />
            <span>{name}</span>
          </span>
          <span className="mini-greeting">Good morning</span>
          <span className="mini-capture" />
          <span className="mini-entry"><b>14</b><i /></span>
          <span className="mini-entry"><b>12</b><i /></span>
          <span className="mini-entry"><b>09</b><i /></span>
        </div>
        <div className="mini-page paper-surface">
          <span className="mini-running"><span>{name}</span><span>no. 12</span></span>
          <span className="mini-date">May 14</span>
          <strong className="mini-title">{title}</strong>
          <p className="mini-body">{body}</p>
          <span className="mini-tag">#{tag}</span>
          {mark && <span className="mini-doodle ornament">{corner}</span>}
          <span className="mini-folio">— 12 —</span>
        </div>
      </div>
      <span className="mini-ribbon ribbon" />
    </div>
  );
}
