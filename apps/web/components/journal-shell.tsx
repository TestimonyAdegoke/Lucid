"use client";

import {
  BookHeart,
  CalendarDays,
  ChevronRight,
  Cloud,
  CloudOff,
  Heart,
  LockKeyhole,
  MoonStar,
  Palette,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DreamEditModal, EditableDream } from "@/components/dream-edit-modal";
import { PatternsModal } from "@/components/patterns-modal";

type ThemeId = "lavender" | "rose" | "sage" | "midnight";

type ApiDream = {
  id: string;
  clientId: string | null;
  title: string;
  content: string;
  dreamedAt: string;
  mood: string | null;
  tags: string[];
  vividness: number | null;
  isLucid: boolean;
  isNightmare: boolean;
  isFavorite: boolean;
};

const themes: Array<{ id: ThemeId; name: string; note: string }> = [
  { id: "lavender", name: "Lavender dusk", note: "soft & dreamy" },
  { id: "rose", name: "Pressed rose", note: "warm & romantic" },
  { id: "sage", name: "Quiet garden", note: "earthy & calm" },
  { id: "midnight", name: "Stargazer", note: "deep & celestial" },
];

const moodOptions = ["peaceful", "happy", "curious", "nostalgic", "anxious", "strange"];

function mapDream(dream: ApiDream): EditableDream {
  return {
    id: dream.id,
    clientId: dream.clientId,
    title: dream.title,
    body: dream.content,
    dreamedAt: dream.dreamedAt,
    mood: dream.mood ?? "unspoken",
    tags: dream.tags,
    vividness: dream.vividness,
    isLucid: dream.isLucid,
    isNightmare: dream.isNightmare,
    isFavorite: dream.isFavorite,
  };
}

function displayDate(value: string, year = true) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    ...(year ? { year: "numeric" as const } : {}),
  }).format(new Date(value));
}

export function JournalShell() {
  const [theme, setTheme] = useState<ThemeId>("lavender");
  const [dreams, setDreams] = useState<EditableDream[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<EditableDream | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("peaceful");
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("lucid.theme") as ThemeId | null;
    if (savedTheme && themes.some((item) => item.id === savedTheme)) setTheme(savedTheme);

    async function loadJournal() {
      try {
        const [dreamResponse, preferenceResponse] = await Promise.all([
          fetch("/api/dreams", { cache: "no-store" }),
          fetch("/api/preferences", { cache: "no-store" }),
        ]);

        if (!dreamResponse.ok) throw new Error("database-unavailable");

        const dreamPayload = (await dreamResponse.json()) as { dreams: ApiDream[] };
        const nextDreams = dreamPayload.dreams.map(mapDream);
        setDreams(nextDreams);
        setSelectedId(nextDreams[0]?.id ?? null);

        if (preferenceResponse.ok) {
          const payload = await preferenceResponse.json();
          const databaseTheme = payload.preferences?.theme as ThemeId | undefined;
          if (databaseTheme && themes.some((item) => item.id === databaseTheme)) {
            setTheme(databaseTheme);
            window.localStorage.setItem("lucid.theme", databaseTheme);
          }
        }
      } catch {
        setSyncError("Your journal could not reach Neon yet.");
      } finally {
        setLoading(false);
      }
    }

    void loadJournal();
  }, []);

  const filteredDreams = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return dreams;
    return dreams.filter((dream) =>
      [dream.title, dream.body, dream.mood, ...dream.tags].join(" ").toLowerCase().includes(needle),
    );
  }, [dreams, query]);

  const selectedDream = dreams.find((dream) => dream.id === selectedId) ?? dreams[0];

  function chooseTheme(nextTheme: ThemeId) {
    setTheme(nextTheme);
    window.localStorage.setItem("lucid.theme", nextTheme);
    void fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    }).catch(() => undefined);
  }

  function replaceDream(next: EditableDream) {
    setDreams((current) => current.map((item) => item.id === next.id ? next : item));
  }

  function removeDream(id: string) {
    setDreams((current) => {
      const next = current.filter((item) => item.id !== id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  async function toggleFavorite(dream: EditableDream) {
    const optimistic = { ...dream, isFavorite: !dream.isFavorite };
    replaceDream(optimistic);

    try {
      const response = await fetch("/api/dreams/" + dream.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: optimistic.isFavorite }),
      });
      if (!response.ok) throw new Error("favorite-failed");
      const payload = (await response.json()) as { dream: ApiDream };
      replaceDream(mapDream(payload.dream));
    } catch {
      replaceDream(dream);
    }
  }

  async function saveDream(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || saving) return;

    setSaving(true);
    setSyncError(null);

    try {
      const response = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: crypto.randomUUID(),
          title,
          content: body,
          mood,
          dreamedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("save-failed");

      const payload = (await response.json()) as { dream: ApiDream };
      const next = mapDream(payload.dream);
      setDreams((current) => [next, ...current.filter((item) => item.id !== next.id)]);
      setSelectedId(next.id);
      setTitle("");
      setBody("");
      setMood("peaceful");
      setComposerOpen(false);
    } catch {
      setSyncError("This dream was not saved. Please try again when Lucid is connected.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={"app-shell theme-" + theme}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#" aria-label="Lucid home">
          <span className="brand-mark"><MoonStar size={18} /></span>
          <span>lucid</span>
        </a>
        <div className="top-actions">
          <span className="privacy"><LockKeyhole size={13} /> Private journal</span>
          <span className={"sync-state " + (syncError ? "offline" : "online")}>
            {syncError ? <CloudOff size={13} /> : <Cloud size={13} />}
            {loading ? "Opening..." : syncError ? "Not synced" : "Neon synced"}
          </span>
          <button className="icon-button" onClick={() => setCustomizeOpen(true)} aria-label="Customize journal"><Palette size={18} /></button>
          <a className="avatar" href="/account" aria-label="My Lucid account">T</a>
        </div>
      </header>

      <section className="journal-stage">
        <div className="journal-cover-shadow" />
        <div className="journal">
          <aside className="journal-index">
            <div className="index-heading">
              <p className="eyebrow">My dream book</p>
              <h1>Good morning <span>♡</span></h1>
              <p className="soft-copy">A quiet place for the things your sleeping mind wants to keep.</p>
            </div>

            <button className="capture-button" onClick={() => setComposerOpen(true)}>
              <span className="capture-icon"><Plus size={20} /></span>
              <span><strong>Write last night's dream</strong><small>Before it slips away</small></span>
              <ChevronRight size={17} />
            </button>

            {syncError && <div className="sync-warning">{syncError}</div>}

            <button className="patterns-button" onClick={() => setPatternsOpen(true)}>
              <span><Sparkles size={14} /> See the threads in my dreams</span><ChevronRight size={14} />
            </button>

            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search my dreams..." />
            </label>

            <div className="entry-list">
              <div className="entry-list-label"><span>Recent pages</span><CalendarDays size={14} /></div>
              {loading && <div className="empty-search">Opening your dream book...</div>}

              {!loading && filteredDreams.map((dream) => (
                <button key={dream.id} className={"entry-preview " + (dream.id === selectedDream?.id ? "active" : "")} onClick={() => setSelectedId(dream.id)}>
                  <span className="entry-date">{displayDate(dream.dreamedAt, false)} {dream.isFavorite && <span className="favorite-mark">★</span>}</span>
                  <strong>{dream.title}</strong>
                  <p>{dream.body}</p>
                </button>
              ))}

              {!loading && !filteredDreams.length && query && <div className="empty-search">No page in your journal matches that yet.</div>}
              {!loading && !dreams.length && !query && (
                <button className="first-page-card" onClick={() => setComposerOpen(true)}>
                  <span>☾</span><strong>Your first page is waiting.</strong><p>Even one image, feeling, person or colour is enough to begin.</p>
                </button>
              )}
            </div>

            <div className="index-footer">
              <Sparkles size={14} />
              <span>{dreams.length >= 3 ? "Lucid is beginning to notice little threads between your dreams." : "The more you remember, the more personal this book becomes."}</span>
            </div>
          </aside>

          <article className="journal-page">
            <div className="binding-line" />
            {selectedDream && <div className="page-tape">dream no. {dreams.findIndex((item) => item.id === selectedDream.id) + 1}</div>}

            {selectedDream ? (
              <>
                <div className="page-date">{displayDate(selectedDream.dreamedAt)}</div>
                <h2>{selectedDream.title}</h2>
                <div className="mood-line"><span className={"mood-dot mood-" + selectedDream.mood} />I woke up feeling <em>{selectedDream.mood}</em></div>

                <div className="page-actions">
                  <button className={"page-action " + (selectedDream.isFavorite ? "active" : "")} onClick={() => void toggleFavorite(selectedDream)}>
                    <Star size={13} /> {selectedDream.isFavorite ? "Kept close" : "Keep close"}
                  </button>
                  <button className="page-action" onClick={() => setEditingDream(selectedDream)}><Pencil size={13} /> Edit page</button>
                </div>

                <p className="dream-body">{selectedDream.body}</p>

                <div className="tag-row">
                  {selectedDream.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  {!selectedDream.tags.length && <span>#freshly-written</span>}
                </div>

                {(selectedDream.vividness || selectedDream.isLucid || selectedDream.isNightmare) && (
                  <div className="dream-meta">
                    {selectedDream.vividness && <span>✦ vivid {selectedDream.vividness}/10</span>}
                    {selectedDream.isLucid && <span>☾ lucid dream</span>}
                    {selectedDream.isNightmare && <span>☁ nightmare</span>}
                  </div>
                )}

                <div className="reflection-card">
                  <div className="reflection-icon"><Sparkles size={17} /></div>
                  <div>
                    <span className="reflection-label">A gentle reflection</span>
                    <p>As this journal grows, Lucid can notice repeating people, places and feelings without deciding what your dream must mean.</p>
                    <button onClick={() => setPatternsOpen(true)}>Explore my patterns <ChevronRight size={14} /></button>
                  </div>
                </div>

                <div className="page-note"><Heart size={14} /><span>Only you can see this page.</span></div>
              </>
            ) : (
              <div className="blank-page">
                <BookHeart size={36} /><h2>Your journal is ready.</h2>
                <p>No sample dreams. No pretend memories. This book begins with yours.</p>
                <button onClick={() => setComposerOpen(true)}>Write your first dream</button>
              </div>
            )}

            <div className="doodle doodle-stars">✦ · ˚ ✧</div>
            <div className="doodle doodle-moon">☾</div>
          </article>
        </div>
      </section>

      <nav className="mobile-tabs" aria-label="Primary">
        <button className="active"><BookHeart size={19} /><span>Journal</span></button>
        <button onClick={() => setPatternsOpen(true)}><Sparkles size={19} /><span>Patterns</span></button>
        <button className="mobile-add" onClick={() => setComposerOpen(true)}><Plus size={24} /></button>
        <button><Search size={19} /><span>Explore</span></button>
        <button onClick={() => setCustomizeOpen(true)}><Palette size={19} /><span>Me</span></button>
      </nav>

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setComposerOpen(false)}>
          <form className="composer paper-modal" onSubmit={saveDream} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" disabled={saving} onClick={() => setComposerOpen(false)}><X size={18} /></button>
            <p className="eyebrow">New dream page</p><h2>What do you remember?</h2>
            <p className="modal-intro">Fragments count. You do not have to make it make sense yet.</p>
            <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a little title... (optional)" />
            <textarea autoFocus value={body} onChange={(event) => setBody(event.target.value)} placeholder="I was somewhere..." rows={9} />
            <div className="mood-picker"><span>I woke up feeling</span><div>
              {moodOptions.map((option) => <button key={option} type="button" className={mood === option ? "selected" : ""} onClick={() => setMood(option)}>{option}</button>)}
            </div></div>
            <button className="save-page" type="submit" disabled={!body.trim() || saving}>{saving ? "Keeping your dream..." : "Keep this dream"} <Heart size={16} /></button>
          </form>
        </div>
      )}

      {customizeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCustomizeOpen(false)}>
          <section className="customizer paper-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setCustomizeOpen(false)}><X size={18} /></button>
            <p className="eyebrow">Make it yours</p><h2>Choose your journal mood</h2>
            <p className="modal-intro">Your dreams stay the same. The book around them can feel like you.</p>
            <div className="theme-grid">{themes.map((option) => (
              <button key={option.id} className={"theme-card " + (theme === option.id ? "selected" : "")} onClick={() => chooseTheme(option.id)}>
                <span className={"theme-swatch swatch-" + option.id}><span /></span><strong>{option.name}</strong><small>{option.note}</small>
              </button>
            ))}</div>
            <div className="customizer-note"><Sparkles size={16} /><p>Next: covers, page texture, type styles, stickers, prompt style and journal density.</p></div>
          </section>
        </div>
      )}

      {editingDream && <DreamEditModal dream={editingDream} onClose={() => setEditingDream(null)} onSaved={replaceDream} onDeleted={removeDream} />}
      {patternsOpen && <PatternsModal dreams={dreams} onClose={() => setPatternsOpen(false)} />}
    </main>
  );
}
