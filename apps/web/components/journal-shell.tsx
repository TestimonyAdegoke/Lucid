"use client";

import { ornamentGlyphs } from "@tardemah/domain";
import {
  ArrowLeft,
  BookOpen,
  Cloud,
  CloudOff,
  Eye,
  Heart,
  ListTree,
  LockKeyhole,
  Map as MapIcon,
  Bookmark,
  Palette,
  Pencil,
  Plus,
  Search,
  Users,
  Waypoints,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Emblem, Logo } from "@/components/brand";
import { Composer } from "@/components/composer";
import { DreamEditModal } from "@/components/dream-edit-modal";
import { PatternsModal } from "@/components/patterns-modal";
import { Studio } from "@/components/studio";
import { FieldAnswers } from "@/components/template-fields";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { api, applyAppearance, displayDate, greeting, initials, type Dream, type Me } from "@/lib/client";

type Filter = "all" | "kept" | "lucid" | "nightmare" | "others";

const shortMonth = new Intl.DateTimeFormat("en", { month: "short" });
const monthYear = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

export function JournalShell() {
  const [me, setMe] = useState<Me | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [composer, setComposer] = useState<{ templateId?: string } | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSyncError(null);
    try {
      const [mePayload, dreamPayload] = await Promise.all([
        api<Me>("/api/me"),
        api<{ dreams: Dream[] }>("/api/dreams"),
      ]);
      applyAppearance(mePayload.preferences.appearance);
      setMe(mePayload);
      setDreams(dreamPayload.dreams);
      setSelectedId(dreamPayload.dreams[0]?.id ?? null);
    } catch {
      setSyncError("Your journal could not be reached just now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    void load();
  }, [load]);

  const canWrite = me ? me.workspace.role !== "VIEWER" : true;
  const isShared = me ? !me.workspace.isPersonal : false;
  const appearance = me?.preferences.appearance;
  const focusLayout = appearance?.layout === "focus";

  // "n" opens a new page, like reaching for the pen on the nightstand.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.closest("input, textarea, select, [contenteditable]") || document.querySelector(".modal-backdrop, .studio-sheet")) return;
      if (me && canWrite) setComposer({});
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [me, canWrite]);

  const filteredDreams = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return dreams.filter((dream) => {
      if (filter === "kept" && !dream.isFavorite) return false;
      if (filter === "lucid" && !dream.isLucid) return false;
      if (filter === "nightmare" && !dream.isNightmare) return false;
      if (filter === "others" && dream.isMine) return false;
      if (!needle) return true;
      const answers = dream.fields ? Object.values(dream.fields.values).join(" ") : "";
      return [dream.title, dream.content, dream.mood, answers, ...dream.tags].join(" ").toLowerCase().includes(needle);
    });
  }, [dreams, query, filter]);

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; dreams: Dream[] }> = [];
    for (const dream of filteredDreams) {
      const label = monthYear.format(new Date(dream.dreamedAt));
      const last = groups[groups.length - 1];
      if (last?.label === label) last.dreams.push(dream);
      else groups.push({ label, dreams: [dream] });
    }
    return groups;
  }, [filteredDreams]);

  const selectedDream = dreams.find((dream) => dream.id === selectedId) ?? dreams[0];
  const dreamNumber = selectedDream ? dreams.length - dreams.findIndex((item) => item.id === selectedDream.id) : 0;

  function replaceDream(next: Dream) {
    setDreams((current) => current.map((item) => (item.id === next.id ? next : item)));
  }

  function removeDream(id: string) {
    setDreams((current) => {
      const next = current.filter((item) => item.id !== id);
      setSelectedId(next[0]?.id ?? null);
      return next;
    });
    setReading(false);
  }

  async function toggleFavorite(dream: Dream) {
    replaceDream({ ...dream, isFavorite: !dream.isFavorite });
    try {
      const payload = await api<{ dream: Dream }>("/api/dreams/" + dream.id, { method: "PATCH", json: { isFavorite: !dream.isFavorite } });
      replaceDream(payload.dream);
    } catch {
      replaceDream(dream);
    }
  }

  async function switchBook(workspaceId: string) {
    try {
      await api("/api/workspaces/active", { method: "POST", json: { workspaceId } });
      setFilter("all");
      setQuery("");
      setReading(false);
      await load();
    } catch (cause) {
      setSyncError(cause instanceof Error ? cause.message : "Tardemah could not open that dream book.");
    }
  }

  function open(dream: Dream) {
    setSelectedId(dream.id);
    setReading(true);
    setContentsOpen(false);
  }

  const firstName = me?.user.name?.split(" ")[0];
  const bookTitle = appearance?.bookTitle || me?.workspace.name || "My Dream Book";
  const [cornerGlyph, markGlyph] = appearance ? ornamentGlyphs(appearance) : ["✦ · ˚ ✧", "☾"];
  const quickTemplates = me?.templates.filter((template) => template.id !== "sys:quick").slice(0, 4) ?? [];
  const firstDate = dreams.length ? dreams[dreams.length - 1].dreamedAt : null;

  return (
    <main className={"app-shell" + (reading ? " is-reading" : "") + (focusLayout ? " layout-focus" : "") + (contentsOpen ? " contents-open" : "")}>
      <header className="topbar">
        <div className="topbar-left">
          <a className="brand" href="/" aria-label="Tardemah home"><Logo size={32} /></a>
          {me && <WorkspaceSwitcher me={me} onSwitch={(id) => void switchBook(id)} />}
        </div>
        <div className="top-actions">
          <span className="top-pill">
            {isShared ? <><Users size={13} /> Shared book</> : <><LockKeyhole size={13} /> Private</>}
          </span>
          <span className={"top-pill sync-state " + (syncError ? "offline" : "online")} title={syncError ?? "All pages saved"}>
            {syncError ? <CloudOff size={13} /> : <Cloud size={13} />}
            {loading ? "Opening…" : syncError ? "Not synced" : "Saved"}
          </span>
          {focusLayout && (
            <button className="icon-button" onClick={() => setContentsOpen((value) => !value)} aria-label="Contents" title="Contents"><ListTree size={17} /></button>
          )}
          <a className="icon-button" href="/graph" aria-label="Dream Map" title="Dream Map"><MapIcon size={17} /></a>
          <button className="icon-button" onClick={() => setStudioOpen(true)} aria-label="Design studio" title="Design studio" disabled={!me}><Palette size={17} /></button>
          <a className="avatar" href="/account" aria-label="My account" title="Account">{initials(me?.user.name)}</a>
        </div>
      </header>

      <section className="book-stage">
        <div className="book">
          <div className="book-cover cover-surface" aria-hidden="true" />
          <div className="book-edges" aria-hidden="true" />
          <span className="book-ribbon ribbon" aria-hidden="true" />

          <div className="book-spread">
            <aside className="journal-index paper-surface paper-deep" aria-label="Contents">
              {focusLayout && <button className="contents-close" onClick={() => setContentsOpen(false)} aria-label="Close contents"><X size={16} /></button>}

              <div className="bookplate">
                <span className="bookplate-emblem"><Emblem emblem={appearance?.emblem ?? "moon"} size={15} /></span>
                <span className="bookplate-text">
                  <strong>{bookTitle}</strong>
                  <small>
                    {isShared
                      ? me?.workspace.memberCount + " dreamers"
                      : firstDate ? "kept since " + monthYear.format(new Date(firstDate)) : "a new book"}
                  </small>
                </span>
              </div>

              <div className="index-heading">
                <h1>{now ? greeting(now) : "Hello"}{firstName ? "," : ""}{firstName && <><br /><em>{firstName}</em></>}</h1>
                <p className="soft-copy">
                  {isShared
                    ? me?.workspace.description || "A shared book. Your pages stay private unless you choose to share them."
                    : "A quiet place for the things your sleeping mind wants to keep."}
                </p>
              </div>

              {canWrite ? (
                <>
                  <button className="capture-button" onClick={() => setComposer({})} disabled={!me}>
                    <span className="capture-icon"><Plus size={19} /></span>
                    <span className="capture-text"><strong>Write last night&apos;s dream</strong><small>before it slips away</small></span>
                    <kbd>N</kbd>
                  </button>
                  {quickTemplates.length > 0 && (
                    <div className="quick-templates" aria-label="Start from a template">
                      {quickTemplates.map((template) => (
                        <button key={template.id} onClick={() => setComposer({ templateId: template.id })} title={template.description}>
                          <span>{template.icon}</span>{template.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="reader-note"><Eye size={15} /> You&apos;re a reader in this book. Shared pages appear here.</div>
              )}

              {syncError && (
                <div className="sync-warning" role="alert">
                  {syncError} <button onClick={() => void load()}>Try again</button>
                </div>
              )}

              <div className="index-tools">
                <label className="search-field">
                  <Search size={15} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages" aria-label="Search dreams" />
                </label>
                <button className="tool-chip" onClick={() => setPatternsOpen(true)} title="Threads in my dreams"><Waypoints size={14} /></button>
              </div>

              <div className="filter-chips" role="tablist" aria-label="Filter dreams">
                {([
                  ["all", "All pages"],
                  ["kept", "Kept close"],
                  ["lucid", "Lucid"],
                  ["nightmare", "Nightmares"],
                  ...(isShared ? [["others", "From others"]] : []),
                ] as Array<[Filter, string]>).map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>
                ))}
              </div>

              <div className="entry-list">
                {loading && (
                  <div className="entry-skeletons" aria-label="Opening your dream book">
                    <span /><span /><span />
                  </div>
                )}

                {!loading && grouped.map((group) => (
                  <div key={group.label} className="entry-group">
                    <div className="entry-list-label"><span>{group.label}</span><i /></div>
                    {group.dreams.map((dream) => {
                      const date = new Date(dream.dreamedAt);
                      return (
                        <button key={dream.id} className={"entry-preview " + (dream.id === selectedDream?.id ? "active" : "")} onClick={() => open(dream)}>
                          <span className="entry-day"><b>{date.getDate()}</b><small>{shortMonth.format(date)}</small></span>
                          <span className="entry-text">
                            <strong>{dream.fields && <span className="entry-template-icon">{dream.fields.template.icon}</span>}{dream.title}</strong>
                            <span className="entry-snippet">{dream.content}</span>
                            <span className="entry-flags">
                              {dream.isFavorite && <span className="flag-kept"><Bookmark size={10} style={{ display: "inline", verticalAlign: "-1px", marginRight: 3 }} />kept</span>}
                              {dream.isLucid && <span>lucid</span>}
                              {dream.isNightmare && <span>nightmare</span>}
                              {!dream.isMine && <span>{dream.author?.name ?? "member"}</span>}
                              {dream.isMine && dream.visibility === "WORKSPACE" && <span>shared</span>}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {!loading && !filteredDreams.length && (query || filter !== "all") && (
                  <div className="empty-search">No page in your journal matches that yet.</div>
                )}
                {!loading && !dreams.length && !query && filter === "all" && canWrite && (
                  <button className="first-page-card" onClick={() => setComposer({})}>
                    <span>{markGlyph || "☾"}</span><strong>Your first page is waiting.</strong><p>Even one image, feeling, person or colour is enough to begin.</p>
                  </button>
                )}
              </div>
            </aside>

            <article className="journal-page paper-surface" aria-live="polite">
              <button className="reading-back" onClick={() => setReading(false)}><ArrowLeft size={15} /> All pages</button>

              {selectedDream ? (
                <div className="page-content" key={selectedDream.id}>
                  <div className="running-head">
                    <span>{bookTitle}</span>
                    <span>No. {dreamNumber}</span>
                  </div>

                  <div className="page-date">{displayDate(selectedDream.dreamedAt)}</div>
                  <h2>{selectedDream.title}</h2>
                  <div className="mood-line">
                    <span className="mood-dot" />
                    {selectedDream.mood ? <>I woke up feeling <em>{selectedDream.mood}</em></> : <>A feeling I didn&apos;t name</>}
                    {!selectedDream.isMine && <span className="page-author">· written by {selectedDream.author?.name ?? "a member"}</span>}
                  </div>

                  {selectedDream.isMine && canWrite && (
                    <div className="page-actions">
                      <button className={"page-action " + (selectedDream.isFavorite ? "active" : "")} onClick={() => void toggleFavorite(selectedDream)}>
                        <Bookmark size={13} fill={selectedDream.isFavorite ? "currentColor" : "none"} /> {selectedDream.isFavorite ? "Kept close" : "Keep close"}
                      </button>
                      <button className="page-action" onClick={() => setEditingDream(selectedDream)}><Pencil size={13} /> Edit page</button>
                    </div>
                  )}

                  <p className="dream-body">{selectedDream.content}</p>

                  {selectedDream.fields && (
                    <FieldAnswers
                      title={selectedDream.fields.template.icon + " " + selectedDream.fields.template.name}
                      prompts={selectedDream.fields.prompts}
                      values={selectedDream.fields.values}
                    />
                  )}

                  {(selectedDream.tags.length > 0 || selectedDream.vividness || selectedDream.isLucid || selectedDream.isNightmare) && (
                    <div className="page-marginalia">
                      {selectedDream.tags.length > 0 && (
                        <div className="tag-row">{selectedDream.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                      )}
                      <div className="dream-meta">
                        {selectedDream.vividness && <span>vividness <b>{selectedDream.vividness}</b>/10</span>}
                        {selectedDream.isLucid && <span>☾ lucid</span>}
                        {selectedDream.isNightmare && <span>☁ nightmare</span>}
                      </div>
                    </div>
                  )}

                  <aside className="reflection-card">
                    <Waypoints size={16} />
                    <div>
                      <span className="reflection-label">A gentle reflection</span>
                      <p>As this book grows, Tardemah notices repeating people, places and feelings — without deciding what your dream must mean.</p>
                      <div className="reflection-links">
                        <button onClick={() => setPatternsOpen(true)}>Threads in my dreams →</button>
                        <a href="/graph">Open the Dream Map →</a>
                      </div>
                    </div>
                  </aside>

                  <footer className="page-foot">
                    <span className="page-note">
                      {selectedDream.visibility === "WORKSPACE"
                        ? <><Users size={13} /> Shared with {me?.workspace.name}</>
                        : <><Heart size={13} /> Only you can see this page</>}
                    </span>
                    <span className="folio">— {dreamNumber} —</span>
                  </footer>
                </div>
              ) : (
                <div className="blank-page">
                  <span className="blank-emblem"><Emblem emblem={appearance?.emblem ?? "moon"} size={26} /></span>
                  <h2>{loading ? "Opening your book…" : "Your book is ready."}</h2>
                  {!loading && <p>No sample dreams. No pretend memories. This book begins with yours.</p>}
                  {!loading && canWrite && <button onClick={() => setComposer({})}><BookOpen size={16} /> Write the first page</button>}
                </div>
              )}

              {cornerGlyph && <div className="doodle doodle-corner ornament" aria-hidden="true">{cornerGlyph}</div>}
              {markGlyph && <div className="doodle doodle-mark ornament" aria-hidden="true">{markGlyph}</div>}
            </article>
          </div>
        </div>
      </section>

      {contentsOpen && <div className="contents-scrim" onClick={() => setContentsOpen(false)} />}

      <nav className="mobile-tabs" aria-label="Primary">
        <button className={!reading ? "active" : ""} onClick={() => setReading(false)}><BookOpen size={19} /><span>Pages</span></button>
        <button onClick={() => setPatternsOpen(true)}><Waypoints size={19} /><span>Threads</span></button>
        {canWrite ? <button className="mobile-add" onClick={() => setComposer({})} aria-label="Write a dream"><Plus size={24} /></button> : <span />}
        <a href="/graph"><MapIcon size={19} /><span>Map</span></a>
        <button onClick={() => setStudioOpen(true)} disabled={!me}><Palette size={19} /><span>Design</span></button>
      </nav>

      {composer && me && (
        <Composer
          me={me}
          initialTemplateId={composer.templateId}
          onClose={() => setComposer(null)}
          onMe={setMe}
          onSaved={(dream) => {
            setDreams((current) => [dream, ...current.filter((item) => item.id !== dream.id)]);
            setSelectedId(dream.id);
            setFilter("all");
            setComposer(null);
          }}
        />
      )}

      {studioOpen && me && <Studio me={me} onChange={setMe} onClose={() => setStudioOpen(false)} />}

      {editingDream && (
        <DreamEditModal
          dream={editingDream}
          sharedBookName={isShared ? me?.workspace.name ?? null : null}
          onClose={() => setEditingDream(null)}
          onSaved={replaceDream}
          onDeleted={removeDream}
        />
      )}

      {patternsOpen && (
        <PatternsModal
          dreams={dreams.filter((dream) => dream.isMine).map((dream) => ({ ...dream, mood: dream.mood ?? "unspoken" }))}
          onClose={() => setPatternsOpen(false)}
        />
      )}
    </main>
  );
}
