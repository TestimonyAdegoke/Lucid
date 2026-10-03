"use client";

import {
  BookHeart,
  CalendarDays,
  ChevronRight,
  Heart,
  LockKeyhole,
  MoonStar,
  Palette,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ThemeId = "lavender" | "rose" | "sage" | "midnight";

type Dream = {
  id: string;
  title: string;
  body: string;
  date: string;
  mood: string;
  tags: string[];
};

const themes: Array<{ id: ThemeId; name: string; note: string }> = [
  { id: "lavender", name: "Lavender dusk", note: "soft & dreamy" },
  { id: "rose", name: "Pressed rose", note: "warm & romantic" },
  { id: "sage", name: "Quiet garden", note: "earthy & calm" },
  { id: "midnight", name: "Stargazer", note: "deep & celestial" },
];

const starterDreams: Dream[] = [
  {
    id: "moonlit-train",
    title: "The moonlit train",
    body: "I was on an old train moving through a field at night. Every window showed a different season. I remember feeling strangely peaceful, like I was going somewhere I already knew.",
    date: "October 3, 2026",
    mood: "peaceful",
    tags: ["train", "night", "journey"],
  },
  {
    id: "blue-house",
    title: "The little blue house",
    body: "There was a tiny blue house at the end of a road I could not remember. Someone had left the porch light on for me.",
    date: "September 29, 2026",
    mood: "nostalgic",
    tags: ["home", "blue", "light"],
  },
  {
    id: "garden-rain",
    title: "Rain in the garden",
    body: "It rained only inside the garden. Outside the gate everything was bright and dry, but I did not want to leave.",
    date: "September 23, 2026",
    mood: "curious",
    tags: ["rain", "garden"],
  },
];

const moodOptions = ["peaceful", "happy", "curious", "nostalgic", "anxious", "strange"];

export function JournalShell() {
  const [theme, setTheme] = useState<ThemeId>("lavender");
  const [dreams, setDreams] = useState<Dream[]>(starterDreams);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(starterDreams[0].id);
  const [composerOpen, setComposerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("peaceful");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("lucid.theme") as ThemeId | null;
    const savedDreams = window.localStorage.getItem("lucid.dreams");

    if (savedTheme && themes.some((item) => item.id === savedTheme)) setTheme(savedTheme);

    if (savedDreams) {
      try {
        const parsed = JSON.parse(savedDreams) as Dream[];
        if (Array.isArray(parsed) && parsed.length) {
          setDreams(parsed);
          setSelectedId(parsed[0].id);
        }
      } catch {
        // Ignore malformed local preview data.
      }
    }
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
  }

  function saveDream(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    const next: Dream = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled dream",
      body: body.trim(),
      date: new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
      mood,
      tags: [],
    };

    const nextDreams = [next, ...dreams];
    setDreams(nextDreams);
    setSelectedId(next.id);
    window.localStorage.setItem("lucid.dreams", JSON.stringify(nextDreams));
    setTitle("");
    setBody("");
    setMood("peaceful");
    setComposerOpen(false);
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
          <button className="icon-button" onClick={() => setCustomizeOpen(true)} aria-label="Customize journal">
            <Palette size={18} />
          </button>
          <button className="avatar" aria-label="Profile">T</button>
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
              <span>
                <strong>Write last night's dream</strong>
                <small>Before it slips away</small>
              </span>
              <ChevronRight size={17} />
            </button>

            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search my dreams..." />
            </label>

            <div className="entry-list">
              <div className="entry-list-label">
                <span>Recent pages</span>
                <CalendarDays size={14} />
              </div>
              {filteredDreams.map((dream) => (
                <button
                  key={dream.id}
                  className={"entry-preview " + (dream.id === selectedDream?.id ? "active" : "")}
                  onClick={() => setSelectedId(dream.id)}
                >
                  <span className="entry-date">{dream.date.replace(", 2026", "")}</span>
                  <strong>{dream.title}</strong>
                  <p>{dream.body}</p>
                </button>
              ))}
              {!filteredDreams.length && <div className="empty-search">No page in your journal matches that yet.</div>}
            </div>

            <div className="index-footer">
              <Sparkles size={14} />
              <span>3 little patterns are waiting to be explored</span>
            </div>
          </aside>

          <article className="journal-page">
            <div className="binding-line" />
            <div className="page-tape">dream no. {dreams.findIndex((item) => item.id === selectedDream?.id) + 1}</div>

            {selectedDream ? (
              <>
                <div className="page-date">{selectedDream.date}</div>
                <h2>{selectedDream.title}</h2>
                <div className="mood-line">
                  <span className={"mood-dot mood-" + selectedDream.mood} />
                  I woke up feeling <em>{selectedDream.mood}</em>
                </div>

                <p className="dream-body">{selectedDream.body}</p>

                <div className="tag-row">
                  {selectedDream.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                  {!selectedDream.tags.length && <span>#freshly-written</span>}
                </div>

                <div className="reflection-card">
                  <div className="reflection-icon"><Sparkles size={17} /></div>
                  <div>
                    <span className="reflection-label">A gentle reflection</span>
                    <p>Lucid will notice repeating people, places and feelings across your journal without deciding what your dream must mean.</p>
                    <button>Explore this dream <ChevronRight size={14} /></button>
                  </div>
                </div>

                <div className="page-note">
                  <Heart size={14} />
                  <span>Only you can see this page.</span>
                </div>
              </>
            ) : (
              <div className="blank-page">
                <BookHeart size={36} />
                <h2>Your journal is ready.</h2>
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
        <button><Sparkles size={19} /><span>Patterns</span></button>
        <button className="mobile-add" onClick={() => setComposerOpen(true)}><Plus size={24} /></button>
        <button><Search size={19} /><span>Explore</span></button>
        <button onClick={() => setCustomizeOpen(true)}><Palette size={19} /><span>Me</span></button>
      </nav>

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)}>
          <form className="composer paper-modal" onSubmit={saveDream} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setComposerOpen(false)}><X size={18} /></button>
            <p className="eyebrow">New dream page</p>
            <h2>What do you remember?</h2>
            <p className="modal-intro">Fragments count. You do not have to make it make sense yet.</p>

            <input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give it a little title... (optional)" />
            <textarea autoFocus value={body} onChange={(event) => setBody(event.target.value)} placeholder="I was somewhere..." rows={9} />

            <div className="mood-picker">
              <span>I woke up feeling</span>
              <div>
                {moodOptions.map((option) => (
                  <button key={option} type="button" className={mood === option ? "selected" : ""} onClick={() => setMood(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button className="save-page" type="submit" disabled={!body.trim()}>
              Keep this dream <Heart size={16} />
            </button>
          </form>
        </div>
      )}

      {customizeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setCustomizeOpen(false)}>
          <section className="customizer paper-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setCustomizeOpen(false)}><X size={18} /></button>
            <p className="eyebrow">Make it yours</p>
            <h2>Choose your journal mood</h2>
            <p className="modal-intro">Your dreams stay the same. The book around them can feel like you.</p>

            <div className="theme-grid">
              {themes.map((option) => (
                <button key={option.id} className={"theme-card " + (theme === option.id ? "selected" : "")} onClick={() => chooseTheme(option.id)}>
                  <span className={"theme-swatch swatch-" + option.id}><span /></span>
                  <strong>{option.name}</strong>
                  <small>{option.note}</small>
                </button>
              ))}
            </div>

            <div className="customizer-note">
              <Sparkles size={16} />
              <p>Next: covers, page texture, type styles, stickers, prompt style and journal density.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
