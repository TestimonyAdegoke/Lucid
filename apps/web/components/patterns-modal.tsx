"use client";

import { ArrowUpRight, Heart, MoonStar, Waypoints, X } from "lucide-react";
import { useEscape } from "@/lib/use-escape";

type PatternDream = {
  mood: string;
  tags: string[];
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
};

function rank(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

export function PatternsModal({ dreams, onClose }: { dreams: PatternDream[]; onClose: () => void }) {
  useEscape(onClose);
  const moods = rank(dreams.map((dream) => dream.mood));
  const tags = rank(dreams.flatMap((dream) => dream.tags));
  const lucid = dreams.filter((dream) => dream.isLucid).length;
  const nightmares = dreams.filter((dream) => dream.isNightmare).length;
  const favorites = dreams.filter((dream) => dream.isFavorite).length;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="paper-modal patterns-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <p className="eyebrow">Threads in my dream book</p>
        <h2>Patterns, gently noticed.</h2>
        <p className="modal-intro">These are simple counts from your own journal—not an interpretation of what your dreams mean.</p>

        {!dreams.length ? (
          <div className="patterns-empty">
            <MoonStar size={30} />
            <strong>Your patterns will grow with your pages.</strong>
            <p>Record a few dreams and Tardemah will begin showing recurring feelings and details.</p>
          </div>
        ) : (
          <>
            <div className="pattern-stats">
              <div><strong>{dreams.length}</strong><span>dreams</span></div>
              <div><strong>{lucid}</strong><span>lucid</span></div>
              <div><strong>{nightmares}</strong><span>nightmares</span></div>
              <div><strong>{favorites}</strong><span>kept close</span></div>
            </div>

            <div className="pattern-columns">
              <section>
                <span className="pattern-kicker"><Heart size={13} /> Feelings that return</span>
                <div className="pattern-bars">
                  {moods.map(([name, count]) => (
                    <div key={name} className="pattern-row">
                      <span>{name}</span>
                      <div><i style={{ width: Math.max(18, (count / moods[0][1]) * 100) + "%" }} /></div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <span className="pattern-kicker"><Waypoints size={13} /> Details that repeat</span>
                {tags.length ? (
                  <div className="pattern-tags">
                    {tags.map(([name, count]) => <span key={name}>#{name} <small>{count}</small></span>)}
                  </div>
                ) : (
                  <p className="pattern-help">Add little tags to dreams—people, places, objects or themes—and recurring details will appear here.</p>
                )}
              </section>
            </div>
            <a className="dream-map-link" href="/graph">Open my Dream Map <ArrowUpRight size={14} /></a>
          </>
        )}
      </section>
    </div>
  );
}
