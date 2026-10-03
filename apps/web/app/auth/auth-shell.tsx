import Link from "next/link";
import { MoonStar } from "lucide-react";
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

      <Link className="auth-brand" href="/">
        <span><MoonStar size={18} /></span>
        lucid
      </Link>

      <section className="auth-book">
        <div className="auth-cover" />
        <div className="auth-paper">
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
