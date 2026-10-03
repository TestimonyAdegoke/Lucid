"use client";

import { defaultAppearance, type Appearance } from "@tardemah/domain";
import { useRef, useState } from "react";
import { JournalPreview } from "@/components/journal-preview";

type HeroDream = {
  id: string;
  label: string;
  title: string;
  body: string;
  tag: string;
  appearance: Partial<Appearance>;
};

const HERO_DREAMS: HeroDream[] = [
  {
    id: "lighthouse",
    label: "Night Pages",
    title: "The lighthouse that hummed",
    body: "I climbed the stairs for what felt like hours, but they were warm, like someone's hand. At the top the light was singing my name, very softly…",
    tag: "stairs",
    appearance: {
      theme: "lavender",
      cover: "celestial",
      coverColor: "#2a2254",
      paper: "lined",
      emblem: "moon",
      bookTitle: "Night Pages",
      ornamentSet: "moons",
    },
  },
  {
    id: "library",
    label: "Forest Ledger",
    title: "The library in the woods",
    body: "Every spine had a date stamped in gold foil instead of a title. When I opened the year 1994, soft rain began falling inside the room, smelling like cedar and moss…",
    tag: "books",
    appearance: {
      theme: "sage",
      cover: "botanical",
      coverColor: "#1d3429",
      paper: "parchment",
      emblem: "feather",
      bookTitle: "Forest Ledger",
      ornamentSet: "botanical",
    },
  },
  {
    id: "venice",
    label: "Tide Book",
    title: "Venetian canal at twilight",
    body: "The water was glowing faintly green. I stepped off the stone bridge and realized I didn't sink at all—I was skimming the surface like a skipping stone.",
    tag: "water",
    appearance: {
      theme: "rose",
      cover: "marble",
      coverColor: "#3d2238",
      paper: "dotgrid",
      emblem: "eye",
      bookTitle: "Tide Book",
      ornamentSet: "moons",
    },
  },
];

const REST = { rx: 4, ry: -6 };

/** The hero's one focal object: a sample dream book, with a quiet switch between three bindings. */
export function HeroInteractive() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState(REST);
  const containerRef = useRef<HTMLDivElement>(null);

  const dream = HERO_DREAMS[activeIdx];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: REST.rx - y * 5, ry: REST.ry + x * 6 });
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTilt(REST);
  }

  return (
    <div
      ref={containerRef}
      className="l-hero-desk"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="l-hero-book-wrap"
        style={{
          transform: `perspective(1600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: isHovered ? "transform 0.2s ease-out" : "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <JournalPreview
          key={dream.id}
          appearance={{ ...defaultAppearance, ...dream.appearance }}
          size="xl"
          title={dream.title}
          body={dream.body}
          tag={dream.tag}
          bookTitle={dream.appearance.bookTitle ?? undefined}
        />
      </div>

      <div className="l-binding" role="group" aria-label="Sample bindings">
        {HERO_DREAMS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className={"l-binding-swatch" + (idx === activeIdx ? " active" : "")}
            style={{ "--swatch": item.appearance.coverColor } as React.CSSProperties}
            aria-pressed={idx === activeIdx}
            aria-label={item.label}
            onClick={() => setActiveIdx(idx)}
          />
        ))}
        <span className="l-binding-name">{dream.label}</span>
      </div>
    </div>
  );
}
