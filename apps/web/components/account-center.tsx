"use client";

import { planLabels, type Role } from "@tardemah/domain";
import { ArrowLeft, Copy, Download, Link2, LogOut, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "@/app/(app)/auth/actions";
import { api, applyAppearance, initials, type Me, type WorkspaceSummary } from "@/lib/client";

type Member = { id: string; userId: string; role: Role; name: string; email: string | null; isYou: boolean; joinedAt: string };
type Invitation = { id: string; email: string | null; role: Role; expiresAt: string };

const roleNames: Record<Role, string> = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member", VIEWER: "Reader" };
const emojis = ["✧", "☾", "✦", "❀", "☁", "◐", "∞", "♡", "☼", "⁂"];

export function AccountCenter() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const payload = await api<Me>("/api/me");
      applyAppearance(payload.preferences.appearance);
      setMe(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tardemah could not open your account.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!me) {
    return (
      <main className="account-page">
        <section className="account-card paper-surface">{error ?? "Opening your account…"}</section>
      </main>
    );
  }

  const usage = me.plan.usage.transcriptions;
  const limit = me.plan.limits.transcriptionsPerMonth;

  return (
    <main className="account-page">
      <div className="account-wrap">
        <a className="account-back" href="/journal"><ArrowLeft size={14} /> Back to my dream book</a>

        <section className="account-card paper-surface account-hero">
          <span className="account-avatar">{initials(me.user.name)}</span>
          <div>
            <p className="eyebrow">My Tardemah</p>
            <h1>{me.user.name || "Your dream journal"}</h1>
            {me.user.authenticated ? (
              <p className="account-copy">Connected to <strong>{me.user.email}</strong>. Sign in on any device to find the same books.</p>
            ) : (
              <p className="account-copy">This journal lives privately on this device. Create an account to keep it safe and carry it to your other devices.</p>
            )}
          </div>
          <div className="account-hero-actions">
            {me.user.authenticated ? (
              <form action={signOut}><button className="ghost-button" type="submit"><LogOut size={14} /> Sign out here</button></form>
            ) : me.features.accounts ? (
              <>
                <a className="primary-link" href="/auth/sign-up">Keep this journal</a>
                <a className="ghost-button" href="/auth/sign-in">I have an account</a>
              </>
            ) : (
              <span className="account-muted">Accounts are not enabled in this environment.</span>
            )}
          </div>
        </section>

        {error && <div className="editor-error" role="alert">{error}</div>}

        <section className="account-card paper-surface">
          <div className="account-section-head">
            <div>
              <p className="eyebrow">Plan</p>
              <h2>{planLabels[me.plan.plan].name} <small>for {me.workspace.name}</small></h2>
              <p className="account-copy">{planLabels[me.plan.plan].blurb}</p>
            </div>
          </div>
          <div className="usage-grid">
            <div className="usage-meter">
              <span>Voice captures this month</span>
              <strong>{usage} <small>/ {limit}</small></strong>
              <div className="meter"><i style={{ width: Math.min(100, (usage / Math.max(limit, 1)) * 100) + "%" }} /></div>
            </div>
            <div className="usage-meter">
              <span>Custom entry templates</span>
              <strong>{me.templates.filter((item) => !item.system).length} <small>/ {me.plan.limits.customEntryTemplates}</small></strong>
            </div>
            <div className="usage-meter">
              <span>Saved styles</span>
              <strong>{me.styles.filter((item) => !item.system).length} <small>/ {me.plan.limits.customStyles}</small></strong>
            </div>
            <div className="usage-meter">
              <span>Seats per shared book</span>
              <strong>{me.plan.limits.membersPerWorkspace}</strong>
            </div>
          </div>
        </section>

        <BooksSection me={me} onReload={load} onError={setError} />

        <section className="account-card paper-surface">
          <p className="eyebrow">Your data</p>
          <h2>Take your dreams with you.</h2>
          <p className="account-copy">Every page you&apos;ve written, across all your dream books. Your dreams belong to you — export them any time.</p>
          <div className="export-actions">
            <a className="ghost-button" href="/api/export?format=markdown" download><Download size={14} /> Markdown journal</a>
            <a className="ghost-button" href="/api/export" download><Download size={14} /> JSON (full detail)</a>
          </div>
        </section>
      </div>
    </main>
  );
}

function BooksSection({ me, onReload, onError }: { me: Me; onReload: () => Promise<void>; onError: (message: string | null) => void }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("✧");
  const [busy, setBusy] = useState(false);
  const [managing, setManaging] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    onError(null);
    try {
      const payload = await api<{ workspace: { id: string } }>("/api/workspaces", { method: "POST", json: { name, description, emoji } });
      setCreating(false);
      setName("");
      setDescription("");
      await onReload();
      setManaging(payload.workspace.id);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not create that book.");
    } finally {
      setBusy(false);
    }
  }

  async function openBook(id: string) {
    await api("/api/workspaces/active", { method: "POST", json: { workspaceId: id } });
    window.location.href = "/journal";
  }

  return (
    <section className="account-card paper-surface" id="books">
      <div className="account-section-head">
        <div>
          <p className="eyebrow">Dream books</p>
          <h2>One for you. Others to share.</h2>
          <p className="account-copy">Start a shared book for a dream circle, a study, or your practice. Every page stays private to its author unless they choose to share it.</p>
        </div>
        {!creating && <button className="primary-link" onClick={() => setCreating(true)}><Plus size={14} /> New shared book</button>}
      </div>

      {creating && (
        <div className="new-book">
          <div className="icon-picker">
            {emojis.map((option) => (
              <button key={option} type="button" className={emoji === option ? "selected" : ""} onClick={() => setEmoji(option)}>{option}</button>
            ))}
          </div>
          <input className="title-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Book name, e.g. “Thursday dream circle”" maxLength={60} />
          <input className="soft-input" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this book for? (optional)" maxLength={240} />
          <div className="editor-actions">
            <button className="ghost-button" onClick={() => setCreating(false)} disabled={busy}>Cancel</button>
            <button className="save-page compact" onClick={() => void create()} disabled={busy || !name.trim()}>{busy ? "Binding…" : "Create book"}</button>
          </div>
        </div>
      )}

      <div className="book-list">
        {me.workspaces.map((workspace) => (
          <div key={workspace.id} className={"book-row " + (workspace.id === me.workspace.id ? "current" : "")}>
            <div className="book-row-main">
              <span className="book-emoji large">{workspace.emoji ?? "☾"}</span>
              <div>
                <strong>{workspace.name} {workspace.id === me.workspace.id && <em>open now</em>}</strong>
                <small>{workspace.isPersonal ? "Personal · only you" : workspace.memberCount + " members · you're " + roleNames[workspace.role].toLowerCase()}</small>
              </div>
              <div className="book-row-actions">
                {workspace.id !== me.workspace.id && <button className="ghost-button" onClick={() => void openBook(workspace.id)}>Open</button>}
                {!workspace.isPersonal && (
                  <button className="ghost-button" onClick={() => setManaging(managing === workspace.id ? null : workspace.id)}>
                    <Users size={14} /> {managing === workspace.id ? "Close" : "Members"}
                  </button>
                )}
              </div>
            </div>
            {managing === workspace.id && <ManageBook me={me} workspace={workspace} onReload={onReload} onError={onError} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function ManageBook({ me, workspace, onReload, onError }: { me: Me; workspace: WorkspaceSummary; onReload: () => Promise<void>; onError: (message: string | null) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [inviteEmail, setInviteEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isAdmin = workspace.role === "OWNER" || workspace.role === "ADMIN";

  const load = useCallback(async () => {
    try {
      const memberPayload = await api<{ members: Member[] }>(`/api/workspaces/${workspace.id}/members`);
      setMembers(memberPayload.members);
      if (isAdmin) {
        const invitePayload = await api<{ invitations: Invitation[] }>(`/api/workspaces/${workspace.id}/invitations`);
        setInvitations(invitePayload.invitations);
      }
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not load this book's members.");
    }
  }, [workspace.id, isAdmin, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite() {
    onError(null);
    try {
      const payload = await api<{ link: string }>(`/api/workspaces/${workspace.id}/invitations`, {
        method: "POST",
        json: { role: inviteRole, email: inviteEmail || undefined },
      });
      setLink(payload.link);
      setInviteEmail("");
      setCopied(false);
      await load();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not create an invitation.");
    }
  }

  async function changeRole(member: Member, role: Role) {
    onError(null);
    try {
      await api(`/api/workspaces/${workspace.id}/members/${member.id}`, { method: "PATCH", json: { role } });
      await load();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not change that role.");
    }
  }

  async function remove(member: Member) {
    const message = member.isYou
      ? "Leave “" + workspace.name + "”? Your private pages in this book will be deleted; pages you shared stay."
      : "Remove " + member.name + " from “" + workspace.name + "”? Their private pages here will be deleted.";
    if (!window.confirm(message)) return;
    onError(null);
    try {
      await api(`/api/workspaces/${workspace.id}/members/${member.id}`, { method: "DELETE" });
      if (member.isYou) {
        if (workspace.id === me.workspace.id) await api("/api/workspaces/active", { method: "POST", json: { workspaceId: me.workspaces.find((item) => item.isPersonal)?.id } });
        await onReload();
      } else {
        await load();
      }
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not complete that.");
    }
  }

  async function revoke(invitation: Invitation) {
    try {
      await api(`/api/workspaces/${workspace.id}/invitations/${invitation.id}`, { method: "DELETE" });
      await load();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not revoke that invitation.");
    }
  }

  async function deleteBook() {
    const typed = window.prompt("This permanently deletes “" + workspace.name + "” and every page in it. Type the book's name to confirm.");
    if (typed === null) return;
    try {
      await api(`/api/workspaces/${workspace.id}`, { method: "DELETE", json: { confirm: typed } });
      if (workspace.id === me.workspace.id) await api("/api/workspaces/active", { method: "POST", json: { workspaceId: me.workspaces.find((item) => item.isPersonal)?.id } });
      await onReload();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Tardemah could not delete this book.");
    }
  }

  const assignable: Role[] = workspace.role === "OWNER" ? ["ADMIN", "MEMBER", "VIEWER"] : ["MEMBER", "VIEWER"];

  return (
    <div className="manage-book">
      <span className="studio-label">Members</span>
      <ul className="member-list">
        {members.map((member) => {
          const editable = isAdmin && !member.isYou && member.role !== "OWNER" && (workspace.role === "OWNER" || member.role !== "ADMIN");
          return (
            <li key={member.id}>
              <span className="member-avatar">{initials(member.name)}</span>
              <span className="member-text"><strong>{member.name}{member.isYou && " (you)"}</strong><small>{member.email ?? "no email"}</small></span>
              {editable ? (
                <select value={member.role} onChange={(event) => void changeRole(member, event.target.value as Role)} aria-label={"Role for " + member.name}>
                  {assignable.map((role) => <option key={role} value={role}>{roleNames[role]}</option>)}
                </select>
              ) : (
                <span className="role-badge">{roleNames[member.role]}</span>
              )}
              {(editable || (member.isYou && member.role !== "OWNER")) && (
                <button className="icon-ghost" onClick={() => void remove(member)} aria-label={member.isYou ? "Leave book" : "Remove " + member.name}>
                  {member.isYou ? <LogOut size={14} /> : <Trash2 size={14} />}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isAdmin && (
        <>
          <span className="studio-label">Invite someone</span>
          <div className="invite-form">
            <input className="soft-input" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Their email (optional — restricts the link)" type="email" />
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Role)} aria-label="Role">
              {assignable.map((role) => <option key={role} value={role}>{roleNames[role]}</option>)}
            </select>
            <button className="save-page compact" onClick={() => void invite()}><Link2 size={14} /> Create link</button>
          </div>
          {link && (
            <div className="invite-link">
              <code>{link}</code>
              <button className="ghost-button" onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true))}>
                <Copy size={13} /> {copied ? "Copied" : "Copy"}
              </button>
              <small>Shown once. Valid for 14 days, single use.</small>
            </div>
          )}
          {invitations.length > 0 && (
            <ul className="invite-list">
              {invitations.map((invitation) => (
                <li key={invitation.id}>
                  <span>{invitation.email ?? "Anyone with the link"} · {roleNames[invitation.role]}</span>
                  <small>expires {new Date(invitation.expiresAt).toLocaleDateString()}</small>
                  <button className="icon-ghost" onClick={() => void revoke(invitation)} aria-label="Revoke invitation"><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {workspace.role === "OWNER" && (
        <div className="danger-zone">
          <button className="delete-page" onClick={() => void deleteBook()}><Trash2 size={14} /> Delete this book</button>
        </div>
      )}
    </div>
  );
}
