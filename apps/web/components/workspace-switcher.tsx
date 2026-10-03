"use client";

import { Check, ChevronDown, Plus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Me } from "@/lib/client";

const roleLabel = { OWNER: "owner", ADMIN: "admin", MEMBER: "member", VIEWER: "reader" } as const;

export function WorkspaceSwitcher({ me, onSwitch }: { me: Me; onSwitch: (workspaceId: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="book-switcher" ref={ref}>
      <button type="button" className="book-switcher-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="book-emoji">{me.workspace.emoji ?? "☾"}</span>
        <span className="book-name">{me.workspace.name}</span>
        {!me.workspace.isPersonal && <span className="book-members"><Users size={11} /> {me.workspace.memberCount}</span>}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="book-menu" role="menu">
          <span className="book-menu-label">Your dream books</span>
          {me.workspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              role="menuitemradio"
              aria-checked={workspace.id === me.workspace.id}
              className={workspace.id === me.workspace.id ? "active" : ""}
              onClick={() => {
                setOpen(false);
                if (workspace.id !== me.workspace.id) onSwitch(workspace.id);
              }}
            >
              <span className="book-emoji">{workspace.emoji ?? "☾"}</span>
              <span className="book-menu-text">
                <strong>{workspace.name}</strong>
                <small>{workspace.isPersonal ? "Private · only you" : workspace.memberCount + " members · " + roleLabel[workspace.role]}</small>
              </span>
              {workspace.id === me.workspace.id && <Check size={14} />}
            </button>
          ))}
          <a className="book-menu-new" href="/account#books" role="menuitem"><Plus size={14} /> Start a shared dream book</a>
        </div>
      )}
    </div>
  );
}
