"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type MotifKind = "symbol" | "place" | "person";
type NodeKind = MotifKind | "dream";

type MapNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: NodeKind;
  count?: number;
  meta?: string;
  excerpt: string;
};

const NODES: MapNode[] = [
  // Recurring motifs — sized by how often they return
  { id: "sym-water", x: 110, y: 150, label: "water", kind: "symbol", count: 5, excerpt: "Warm, luminous water, usually where one place turns into another." },
  { id: "sym-stairs", x: 330, y: 195, label: "spiral stairs", kind: "symbol", count: 4, excerpt: "Endless staircases that never tire you, climbed at moments of change." },
  { id: "sym-key", x: 480, y: 305, label: "silver key", kind: "symbol", count: 3, excerpt: "A small ornate key with an unfamiliar emblem." },
  { id: "plc-lighthouse", x: 255, y: 62, label: "the lighthouse", kind: "place", count: 3, excerpt: "A beacon on the cliffs whose light hums as it sweeps the coast." },
  { id: "plc-forest", x: 505, y: 90, label: "glass forest", kind: "place", count: 4, excerpt: "Pines whose leaves chime like crystal in the night air." },
  { id: "per-grandmother", x: 290, y: 345, label: "grandmother", kind: "person", count: 3, excerpt: "Present in moments of stillness. She never speaks — only gives." },
  { id: "per-sister", x: 110, y: 310, label: "sister", kind: "person", count: 4, excerpt: "A steady companion, often laughing, pointing toward hidden doors." },

  // Dreams
  { id: "dream-lighthouse", x: 220, y: 140, label: "The lighthouse that hummed", kind: "dream", meta: "May 14 · wonder", excerpt: "“The stairs were warm, like someone's hand. At the top the light was singing my name.”" },
  { id: "dream-sea", x: 50, y: 235, label: "The house by the sea", kind: "dream", meta: "May 19 · serene", excerpt: "“Every doorway in the hallway opened directly onto water.”" },
  { id: "dream-ferry", x: 195, y: 245, label: "Night ferry crossing", kind: "dream", meta: "Jun 24 · calm", excerpt: "“We drifted past drowned arches. The lighthouse beam lay on the water in green rings.”" },
  { id: "dream-library", x: 425, y: 165, label: "The library in the woods", kind: "dream", meta: "Jun 11 · awe", excerpt: "“Every spine had a date stamped in gold foil instead of a title.”" },
  { id: "dream-attic", x: 415, y: 250, label: "Attic of ancient clocks", kind: "dream", meta: "Jul 05 · intrigue", excerpt: "“The silver key turned the clock hands backward, and sunrise reversed into night.”" },
  { id: "dream-garden", x: 385, y: 365, label: "The garden with lanterns", kind: "dream", meta: "Jun 02 · nostalgia", excerpt: "“Grandmother handed me a silver key: I would know the gate when I saw it.”" },
];

const EDGES: [string, string][] = [
  ["dream-lighthouse", "sym-water"], ["dream-lighthouse", "sym-stairs"], ["dream-lighthouse", "plc-lighthouse"],
  ["dream-sea", "sym-water"], ["dream-sea", "per-sister"],
  ["dream-ferry", "sym-water"], ["dream-ferry", "plc-lighthouse"], ["dream-ferry", "per-sister"],
  ["dream-library", "sym-stairs"], ["dream-library", "plc-forest"],
  ["dream-attic", "sym-stairs"], ["dream-attic", "sym-key"],
  ["dream-garden", "sym-key"], ["dream-garden", "per-grandmother"],
];

const BY_ID = new Map(NODES.map((node) => [node.id, node]));
const KIND_LABEL: Record<NodeKind, string> = { symbol: "Symbol", place: "Place", person: "Person", dream: "Dream" };
const LEGEND: { kind: MotifKind; label: string }[] = [
  { kind: "symbol", label: "Symbols" },
  { kind: "place", label: "Places" },
  { kind: "person", label: "People" },
];

const STAR = "M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z";

export function DreamMapShowcase() {
  const [selectedId, setSelectedId] = useState("sym-stairs");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MotifKind | null>(null);

  const active = BY_ID.get(hoveredId ?? selectedId) ?? NODES[1];

  // A legend filter lights every motif of that kind and the dreams it appears in; otherwise, the active node's threads.
  const lit = useMemo(() => {
    const nodes = new Set<string>();
    const edges = new Set<string>();
    const touches = (id: string) => (filter ? BY_ID.get(id)?.kind === filter : id === active.id);
    if (!filter) nodes.add(active.id);
    for (const node of NODES) if (filter && node.kind === filter) nodes.add(node.id);
    for (const [a, b] of EDGES) {
      if (touches(a) || touches(b)) {
        nodes.add(a);
        nodes.add(b);
        edges.add(a + b);
      }
    }
    return { nodes, edges };
  }, [active.id, filter]);

  function choose(id: string) {
    setSelectedId(id);
    setHoveredId(null);
    setFilter(null);
  }

  return (
    <section className="l-section l-night l-constellation" id="map">
      <div className="cm">
        <div className="cm-copy" data-reveal>
          <p className="l-eyebrow">The Dream Constellation</p>
          <h2>Observation, never a verdict.</h2>
          <p className="cm-lead">
            Over weeks, Tardemah notices what returns — water, a staircase, your grandmother — and draws the threads
            between your nights. It never tells you what they mean.
          </p>

          <div className="cm-legend" role="group" aria-label="Show recurring">
            {LEGEND.map((item) => (
              <button
                key={item.kind}
                type="button"
                className={"cm-key " + item.kind}
                aria-pressed={filter === item.kind}
                onClick={() => setFilter(filter === item.kind ? null : item.kind)}
              >
                <i /> {item.label}
              </button>
            ))}
            <span className="cm-key dream"><i /> Dreams</span>
          </div>

          <Link href="/graph" className="l-button cm-cta">
            Open your Dream Map <ArrowRight size={16} />
          </Link>
        </div>

        <figure className="cm-figure" data-reveal>
          <svg viewBox="0 0 560 410" className="cm-svg" role="group" aria-label="A sample dream constellation">
            {EDGES.map(([a, b]) => {
              const from = BY_ID.get(a)!;
              const to = BY_ID.get(b)!;
              return <line key={a + b} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={"cm-edge" + (lit.edges.has(a + b) ? " lit" : "")} />;
            })}

            {NODES.map((node) => {
              const faded = !lit.nodes.has(node.id);
              const isActive = !filter && node.id === active.id;
              const radius = node.count ? 5 + node.count * 2.4 : 0;
              return (
                <g
                  key={node.id}
                  className={`cm-node ${node.kind}${isActive ? " active" : ""}${faded ? " faded" : ""}`}
                  transform={`translate(${node.x} ${node.y})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={node.id === selectedId}
                  aria-label={`${KIND_LABEL[node.kind]}: ${node.label}`}
                  onClick={() => choose(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      choose(node.id);
                    }
                  }}
                  onMouseEnter={() => { setHoveredId(node.id); setFilter(null); }}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => { setHoveredId(node.id); setFilter(null); }}
                  onBlur={() => setHoveredId(null)}
                >
                  {node.kind === "dream" ? (
                    <>
                      <circle r="14" className="cm-hit" />
                      <path d={STAR} className="cm-star" />
                    </>
                  ) : (
                    <>
                      <circle r={radius + 7} className="cm-halo" />
                      <circle r={radius} className="cm-body" />
                      <circle r="2.5" className="cm-core" />
                      <text y={radius + 17} textAnchor="middle" className="cm-label">{node.label}</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          <figcaption className="cm-caption" aria-live="polite">
            {filter ? (
              <>
                <span className={"cm-kind " + filter}>{LEGEND.find((item) => item.kind === filter)?.label} that return</span>
                <strong>{NODES.filter((node) => node.kind === filter).map((node) => node.label).join(" · ")}</strong>
                <span className="cm-excerpt">
                  Woven through {NODES.filter((node) => node.kind === "dream" && lit.nodes.has(node.id)).length} of your last {NODES.filter((node) => node.kind === "dream").length} dreams.
                </span>
              </>
            ) : (
              <>
                <span className={"cm-kind " + active.kind}>
                  {KIND_LABEL[active.kind]}
                  {active.count ? ` · returns in ${active.count} dreams` : active.meta ? ` · ${active.meta}` : ""}
                </span>
                <strong>{active.label}</strong>
                <span className="cm-excerpt">{active.excerpt}</span>
              </>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
