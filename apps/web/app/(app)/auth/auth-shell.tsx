import Link from "next/link";
import { Logo } from "@/components/brand";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  copy,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <Link className="auth-brand" href="/" aria-label="Tardemah home">
        <Logo size={32} hebrew />
      </Link>

      <section className="auth-book">
        <div className="auth-cover" />
        <div className="auth-paper paper-surface">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-copy">{copy}</p>
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </section>
    </main>
  );
}
