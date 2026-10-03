"use client";

import { ArrowLeft, Heart, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DreamNode = {
  id: string;
  title: string;
  dreamedAt: string;
  mood: string | null;
  isFavorite: boolean;
};

type EntityNode = {
  id: string;
  kind: string;
  label: string;
  count: number;
  dreamIds: string[];
};

type GraphEdge = {
  from: string;
  to: string;
  strength: number;
  kind: "entity" | "connection";
  sharedEntities?: string[];
  sharedTags?: string[];
};

type GraphData = {
  dreams: DreamNode[];
  entities: EntityNode[];
  edges: GraphEdge[];
};

type Point = { x: number; y: number };

function ring(index: number, total: number, radius: number, centerX: number, centerY: number, offset = 0): Point {
  const angle = offset + (Math.PI * 2 * index) / Math.max(total, 1);
  return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius };
}

export function DreamGraphView() {
  const [data, setData] = useState<GraphData | null>(null);
  const [selected, setSelected] = useState<{ type: "dream" | "entity"; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/graph", { cache: "no-store" });
      if (!response.ok) throw new Error("graph");
      setData(await response.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const dreams = data?.dreams.slice(0, 18) ?? [];
    const dreamIds = new Set(dreams.map((dream) => dream.id));
    const entities = (data?.entities ?? [])
      .filter((entity) => entity.dreamIds.some((id) => dreamIds.has(id)))
      .slice(0, 18);
    const entityIds = new Set(entities.map((entity) => entity.id));
    const edges = (data?.edges ?? []).filter((edge) =>
      dreamIds.has(edge.from) &&
      (dreamIds.has(edge.to) || entityIds.has(edge.to))
    );
    return { dreams, entities, edges };
  }, [data]);

  const positions = useMemo(() => {
    const map = new Map<string, Point>();
    visible.dreams.forEach((dream, index) => map.set(dream.id, ring(index, visible.dreams.length, 285, 500, 335, -Math.PI / 2)));
    visible.entities.forEach((entity, index) => map.set(entity.id, ring(index, visible.entities.length, 155, 500, 335, -Math.PI / 2 + 0.18)));
    return map;
  }, [visible]);

  const selectedDream = selected?.type === "dream" ? visible.dreams.find((dream) => dream.id === selected.id) : null;
  const selectedEntity = selected?.type === "entity" ? visible.entities.find((entity) => entity.id === selected.id) : null;
  const selectedConnections = selectedDream
    ? visible.edges.filter((edge) => edge.kind === "connection" && (edge.from === selectedDream.id || edge.to === selectedDream.id)).slice(0, 4)
    : [];

  return (
    <main className="dream-map-page">
      <header className="dream-map-header">
        <a href="/"><ArrowLeft size={15} /> My dream book</a>
        <button onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? "voice-spinner" : ""} /> Refresh map</button>
      </header>

      <section className="dream-map-intro">
        <p className="eyebrow">My Dream Map</p>
        <h1>The little world behind my pages.</h1>
        <p>Dreams sit around the outside. People, places, objects and recurring details gather inside. Lines show shared surface details and similarity—not a declaration of meaning.</p>
      </section>

      {!data?.dreams.length && !loading ? (
        <section className="dream-map-empty"><Sparkles size={30} /><h2>Your constellation begins with a dream.</h2><a href="/">Write a page first</a></section>
      ) : (
        <section className="dream-map-book">
          <div className="dream-map-canvas">
            {loading && <div className="dream-map-loading">connecting the dots…</div>}
            <svg viewBox="0 0 1000 670" role="img" aria-label="A network map of dreams and recurring details">
              <g className="map-edges">
                {visible.edges.map((edge, index) => {
                  const from = positions.get(edge.from);
                  const to = positions.get(edge.to);
                  if (!from || !to) return null;
                  return (
                    <line
                      key={edge.kind + ":" + edge.from + ":" + edge.to + ":" + index}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      className={"map-edge " + edge.kind}
                      style={{ opacity: Math.max(0.16, Math.min(0.72, edge.strength)) }}
                    />
                  );
                })}
              </g>

              <g>
                {visible.entities.map((entity) => {
                  const point = positions.get(entity.id)!;
                  const active = selected?.id === entity.id;
                  return (
                    <g key={entity.id} className={"map-node entity-node " + (active ? "active" : "")} onClick={() => setSelected({ type: "entity", id: entity.id })}>
                      <circle cx={point.x} cy={point.y} r={18 + Math.min(10, entity.count * 2)} />
                      <text x={point.x} y={point.y + 4} textAnchor="middle">{entity.label.slice(0, 13)}</text>
                    </g>
                  );
                })}

                {visible.dreams.map((dream) => {
                  const point = positions.get(dream.id)!;
                  const active = selected?.id === dream.id;
                  return (
                    <g key={dream.id} className={"map-node dream-node " + (active ? "active" : "")} onClick={() => setSelected({ type: "dream", id: dream.id })}>
                      <circle cx={point.x} cy={point.y} r={dream.isFavorite ? 26 : 23} />
                      <text x={point.x} y={point.y - 2} textAnchor="middle">☾</text>
                      {dream.isFavorite && <text x={point.x + 20} y={point.y - 18} className="map-favorite">♡</text>}
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="dream-map-legend">
              <span><i className="legend-dream" /> dream</span>
              <span><i className="legend-detail" /> recurring detail</span>
              <span><i className="legend-line" /> connection</span>
            </div>
          </div>

          <aside className="dream-map-note">
            {!selectedDream && !selectedEntity && (
              <>
                <Sparkles size={19} />
                <h2>Touch a point.</h2>
                <p>Lucid will show why that dream or detail appears in this map.</p>
              </>
            )}

            {selectedEntity && (
              <>
                <span className="map-note-kind">{selectedEntity.kind.toLowerCase()}</span>
                <h2>{selectedEntity.label}</h2>
                <p>This detail appears in <strong>{selectedEntity.count}</strong> {selectedEntity.count === 1 ? "dream" : "dreams"} currently shown in your journal.</p>
                <div className="map-note-list">
                  {visible.dreams.filter((dream) => selectedEntity.dreamIds.includes(dream.id)).slice(0, 5).map((dream) => <span key={dream.id}>☾ {dream.title}</span>)}
                </div>
              </>
            )}

            {selectedDream && (
              <>
                <span className="map-note-kind">dream</span>
                <h2>{selectedDream.title} {selectedDream.isFavorite && <Heart size={15} fill="currentColor" />}</h2>
                <p>{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(selectedDream.dreamedAt))}{selectedDream.mood ? " · " + selectedDream.mood : ""}</p>
                {selectedConnections.length ? (
                  <>
                    <span className="map-note-sub">Dreams that echo this one</span>
                    <div className="map-note-list">
                      {selectedConnections.map((edge) => {
                        const otherId = edge.from === selectedDream.id ? edge.to : edge.from;
                        const other = visible.dreams.find((dream) => dream.id === otherId);
                        if (!other) return null;
                        const reasons = [...(edge.sharedEntities ?? []), ...(edge.sharedTags ?? []).map((tag) => "#" + tag)].slice(0, 3);
                        return <span key={otherId}>☾ {other.title}{reasons.length ? " · " + reasons.join(", ") : ""}</span>;
                      })}
                    </div>
                  </>
                ) : <p className="map-quiet">No strong echoes yet. That is completely normal for a young journal.</p>}
              </>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
