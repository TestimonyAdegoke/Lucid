import { planEntitlements, planLabels, systemEntryTemplates, type Plan } from "@tardemah/domain";
import { ArrowRight, Download, EyeOff, Fingerprint, Mic, Plus, Users } from "lucide-react";
import Link from "next/link";
import { HEBREW_NAME, Logo } from "@/components/brand";
import { DesignPlayground } from "@/components/landing/design-playground";
import { DreamMapShowcase } from "@/components/landing/dream-map-showcase";
import { HeroInteractive } from "@/components/landing/hero-interactive";
import { LandingEffects } from "@/components/landing/landing-effects";
import { TemplateShowcase } from "@/components/landing/template-showcase";
import { hasJournalCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

const faqs = [
  { q: "Do I need an account to start?", a: "No. Open your book and write — it lives privately on this device. Create an account whenever you want the same book on your phone and laptop, and the pages you've already written come with you." },
  { q: "Who can read my dreams?", a: "Only you. There are no feeds, followers or public profiles. In a shared book, each page stays private to its writer unless they choose to share that page with the book." },
  { q: "What happens to my voice recordings?", a: "A recording is sent for transcription and then discarded. Tardemah keeps your words, not your voice." },
  { q: "Will Tardemah tell me what my dreams mean?", a: "No. It notices what returns — a staircase, a person, a feeling — and shows you the pattern. Interpretation is yours, or your therapist's, or your tradition's. Never the app's." },
  { q: "Can I take my dreams with me?", a: "Always. Export every page as Markdown or JSON from your account, at any time." },
  { q: "What does the name mean?", a: "Tardemah (תַּרְדֵּמָה) is the Hebrew word for a deep sleep — the heavy, vision-filled sleep of the old stories. It's where the pages in this book come from." },
];

export default async function Landing() {
  const returning = await hasJournalCookie();
  const primary = { href: "/journal", label: returning ? "Open my dream book" : "Start your dream book" };

  return (
    <div className="landing">
      <LandingEffects />

      <header className="l-nav">
        <div className="l-nav-inner">
          <Link href="/" className="l-brand" aria-label="Tardemah home"><Logo size={34} hebrew /></Link>
          <nav aria-label="Main">
            <a href="#ritual">The ritual</a>
            <a href="#bindery">Make it yours</a>
            <a href="#templates">Templates</a>
            <a href="#together">Together</a>
            <a href="#faq">Questions</a>
          </nav>
          <div className="l-nav-actions">
            {!returning && <Link href="/auth/sign-in" className="l-link">Sign in</Link>}
            <Link href="/journal" className="l-button small">{returning ? "Open journal" : "Begin"}</Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="l-hero">
        <div className="l-sky" aria-hidden="true">
          <div className="l-sky-aurora" />
          <span className="l-moon" />
        </div>

        <div className="l-hero-copy">
          <p className="l-kicker">A private dream journal</p>
          <h1>Keep the worlds you visit <em>in your sleep.</em></h1>
          <p className="l-lede">
            Dreams fade within minutes of waking. Speak or write yours before they go, in a book that&apos;s
            yours alone, and see what keeps coming back.
          </p>
          <div className="l-cta-row">
            <Link href={primary.href} className="l-button primary-heavy">
              {primary.label} <ArrowRight size={16} />
            </Link>
            <a href="#ritual" className="l-text-link">See how it works</a>
          </div>
          <p className="l-hero-subnote">Free · No account needed · Private to you</p>
        </div>

        <div className="l-hero-art">
          <HeroInteractive />
        </div>
      </section>

      {/* ───────── Name ───────── */}
      <section className="l-name" data-reveal>
        <p className="l-name-word" lang="he" dir="rtl">{HEBREW_NAME}</p>
        <p className="l-name-say"><i>tar·de·mah</i> · noun · Hebrew</p>
        <p className="l-name-def">
          A deep sleep — the heavy, vision-filled sleep of the old stories. We named the journal for the place
          your dreams come from, and made it a quiet place to keep them.
        </p>
      </section>

      {/* ───────── Ritual ───────── */}
      <section className="l-section" id="ritual">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">A morning ritual</p>
          <h2>Half-awake is the whole point.</h2>
          <p>Dreams dissolve within minutes of waking. Tardemah is built for that window — one tap, no setup, no friction.</p>
        </div>
        <div className="l-ritual">
          <article data-reveal>
            <span className="l-step">I</span>
            <h3>Speak or scribble</h3>
            <p>Talk it out with your eyes still closed. Your voice becomes a page; the recording is discarded.</p>
            <div className="vignette vignette-voice">
              <span className="vg-mic"><Mic size={15} /></span>
              <span className="l-wave dark"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>
              <span className="vg-time">0:14</span>
            </div>
          </article>
          <article data-reveal>
            <span className="l-step">II</span>
            <h3>Shape the page</h3>
            <p>Use a template, skip any question, or ask yourself something new. Fragments always count.</p>
            <div className="vignette vignette-question">
              <span className="vg-q">How clear was the lucidity?</span>
              <span className="vg-scale">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < 8 ? "on" : ""} />)}</span>
              <span className="vg-add"><Plus size={12} /> Ask yourself something else</span>
            </div>
          </article>
          <article data-reveal>
            <span className="l-step">III</span>
            <h3>See the threads</h3>
            <p>Over weeks, recurring people, places and symbols gather into a map of your inner landscape.</p>
            <div className="vignette vignette-map">
              <svg viewBox="0 0 220 90" aria-hidden="true">
                <line x1="30" y1="45" x2="95" y2="22" /><line x1="95" y1="22" x2="160" y2="52" /><line x1="30" y1="45" x2="110" y2="70" /><line x1="110" y1="70" x2="160" y2="52" /><line x1="160" y1="52" x2="200" y2="24" />
                <circle cx="30" cy="45" r="7" className="d" /><circle cx="95" cy="22" r="11" /><circle cx="160" cy="52" r="7" className="d" /><circle cx="110" cy="70" r="7" className="d" /><circle cx="200" cy="24" r="6" className="d" />
              </svg>
            </div>
          </article>
        </div>
      </section>

      {/* ───────── Bindery ───────── */}
      <section className="l-section l-tinted" id="bindery">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">Make it yours</p>
          <h2>Not a theme picker. A bindery.</h2>
          <p>
            Start from a hand-made style, or choose every detail: any colour for paper, ink and cloth; separate faces
            for headings and writing; cover, paper, grain, ribbon, drop capitals, the surface your book rests on — even its name.
            Try it:
          </p>
        </div>
        <div data-reveal><DesignPlayground /></div>
      </section>

      {/* ───────── Templates ───────── */}
      <section className="l-section" id="templates">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">Entry templates</p>
          <h2>A starting point, never a cage.</h2>
          <p>Different nights need different pages. Begin from a template, skip anything that doesn&apos;t fit, and ask yourself something new whenever you like.</p>
        </div>
        <div data-reveal><TemplateShowcase templates={systemEntryTemplates} /></div>
      </section>

      {/* ───────── Dream Map ───────── */}
      <DreamMapShowcase />

      {/* ───────── Together ───────── */}
      <section className="l-section" id="together">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow"><Users size={13} /> Shared dream books</p>
          <h2>For one dreamer, or a whole circle.</h2>
          <p>Your personal book is always just yours. Start shared books for a dream circle, a study or a practice — each one its own private space.</p>
        </div>
        <div className="l-cards four">
          <article data-reveal><h3>Private by default</h3><p>Members only see the pages an author explicitly chooses to share with the book.</p></article>
          <article data-reveal><h3>Roles that make sense</h3><p>Owners, admins, members who write, and readers who can only read what&apos;s shared.</p></article>
          <article data-reveal><h3>Invite with a link</h3><p>Single-use links, optionally locked to an email address, that expire after two weeks.</p></article>
          <article data-reveal><h3>House templates & styles</h3><p>Give a circle the same check-in questions and a house style — while everyone keeps their own look.</p></article>
        </div>
      </section>

      {/* ───────── Privacy ───────── */}
      <section className="l-section l-tinted" id="privacy">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">Private by design</p>
          <h2>Your dreams belong to you.</h2>
        </div>
        <div className="l-cards four icons">
          <article data-reveal><EyeOff size={20} /><h3>No audience</h3><p>No feeds, no followers, no public profiles. Nothing leaves your book unless you choose.</p></article>
          <article data-reveal><Mic size={20} /><h3>Words, not voice</h3><p>Recordings are used for transcription, then discarded. Only your words remain.</p></article>
          <article data-reveal><Fingerprint size={20} /><h3>Start anonymously</h3><p>Write on this device straight away. Add an account later to carry the same book everywhere.</p></article>
          <article data-reveal><Download size={20} /><h3>Export any time</h3><p>Every page as Markdown or JSON. No lock-in, ever.</p></article>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="l-section" id="faq">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">Questions</p>
          <h2>Before you turn the first page.</h2>
        </div>
        <div className="l-faq" data-reveal>
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── Plans ───────── */}
      <section className="l-section l-tinted" id="plans">
        <div className="l-section-head" data-reveal>
          <p className="l-eyebrow">Plans</p>
          <h2>Begin free. Grow when you need to.</h2>
          <p>Tardemah is in early access. Everyone starts on Free; Plus and Studio are on the way.</p>
        </div>
        <div className="l-plans">
          {(["FREE", "PLUS", "STUDIO"] as Plan[]).map((plan) => {
            const limits = planEntitlements[plan];
            return (
              <article key={plan} className={"l-plan " + (plan === "FREE" ? "featured" : "")} data-reveal>
                <h3>{planLabels[plan].name}</h3>
                <p>{planLabels[plan].blurb}</p>
                <ul>
                  <li>Unlimited typed dreams & full design studio</li>
                  <li>{limits.transcriptionsPerMonth.toLocaleString()} voice captures a month</li>
                  <li>{limits.customEntryTemplates} custom templates · {limits.customStyles} saved styles</li>
                  <li>{limits.ownedSharedWorkspaces} shared book{limits.ownedSharedWorkspaces === 1 ? "" : "s"} · {limits.membersPerWorkspace} seats each</li>
                </ul>
                {plan === "FREE" ? <Link href="/journal" className="l-button small">Start free</Link> : <span className="l-soon">Coming soon</span>}
              </article>
            );
          })}
        </div>
      </section>

      {/* ───────── Final invitation ───────── */}
      <section className="l-final" id="begin">
        <div className="l-final-inner" data-reveal>
          <span className="l-final-moon" aria-hidden="true" />
          <h2>Tonight, leave the book open.</h2>
          <p>Tomorrow, before the day rushes in, write down the first thing you remember.</p>
          <Link href={primary.href} className="l-button primary-heavy">
            {primary.label} <ArrowRight size={16} />
          </Link>
          {!returning && (
            <p className="l-final-note">
              No account needed. <Link href="/auth/sign-in">Sign in</Link> to keep it on every device.
            </p>
          )}
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="l-footer-brand">
            <Link href="/" className="l-brand" aria-label="Tardemah home"><Logo size={28} /></Link>
            <p>A private dream journal for web and phone.</p>
          </div>
          <nav className="l-footer-links" aria-label="Footer">
            <div>
              <h4>Tardemah</h4>
              <a href="#ritual">The ritual</a>
              <a href="#bindery">Make it yours</a>
              <a href="#templates">Templates</a>
              <a href="#together">Shared books</a>
            </div>
            <div>
              <h4>Your book</h4>
              <Link href="/journal">Open journal</Link>
              <Link href="/auth/sign-in">Sign in</Link>
              <a href="#privacy">Privacy</a>
              <a href="#faq">Questions</a>
            </div>
          </nav>
        </div>
        <div className="l-footer-base">
          <p>© {new Date().getFullYear()} Tardemah</p>
          <p className="l-footer-word">
            <span lang="he" dir="rtl">{HEBREW_NAME}</span> · a deep sleep, full of visions
          </p>
        </div>
      </footer>
    </div>
  );
}
