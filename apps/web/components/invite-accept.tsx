"use client";

import { useEffect, useState } from "react";
import { api, ClientError } from "@/lib/client";

type Preview = {
  workspace: { id: string; name: string; emoji: string | null; description: string | null };
  role: "ADMIN" | "MEMBER" | "VIEWER";
  invitedBy: string | null;
  emailRestricted: boolean;
  requiresAccount: boolean;
};

const roleCopy = {
  ADMIN: "an admin — you can invite people and manage the book",
  MEMBER: "a member — you can write and share pages",
  VIEWER: "a reader — you can read pages members share",
};

export function InviteAccept({ token }: { token: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = "/invite/" + encodeURIComponent(token);

  useEffect(() => {
    api<{ invitation: Preview }>("/api/invitations/" + encodeURIComponent(token))
      .then((payload) => setPreview(payload.invitation))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "This invitation could not be opened."));
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/invitations/" + encodeURIComponent(token), { method: "POST" });
      window.location.href = "/journal";
    } catch (cause) {
      if (cause instanceof ClientError && cause.code === "auth") setNeedsAuth(true);
      setError(cause instanceof Error ? cause.message : "Tardemah could not accept this invitation.");
      setBusy(false);
    }
  }

  if (error && !preview) return <div className="auth-error" role="alert">{error}</div>;
  if (!preview) return <p className="auth-copy">Opening the invitation…</p>;

  return (
    <div className="invite-card">
      <div className="invite-book">
        <span className="book-emoji large">{preview.workspace.emoji ?? "✧"}</span>
        <div>
          <strong>{preview.workspace.name}</strong>
          {preview.workspace.description && <small>{preview.workspace.description}</small>}
        </div>
      </div>
      <p className="auth-copy">
        {preview.invitedBy ? preview.invitedBy + " invited you" : "You've been invited"} to join as {roleCopy[preview.role]}.
        {preview.emailRestricted && " This invitation is for a specific email address."}
      </p>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {needsAuth ? (
        <div className="auth-form">
          <a className="auth-button" href={"/auth/sign-up?next=" + encodeURIComponent(next)}>Create an account to join</a>
          <a className="auth-button secondary" href={"/auth/sign-in?next=" + encodeURIComponent(next)}>I already have one</a>
        </div>
      ) : (
        <div className="auth-form">
          <button type="button" onClick={() => void accept()} disabled={busy}>{busy ? "Joining…" : "Join this dream book"}</button>
        </div>
      )}
    </div>
  );
}
