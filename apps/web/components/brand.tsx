import { Compass, Eye, Feather, Flower2, KeyRound, MoonStar } from "lucide-react";

export const HEBREW_NAME = "תַּרְדֵּמָה";

const CRESCENT = "M17.25 10.07 A11.5 11.5 0 1 0 29.69 24.16 A9.4 9.4 0 0 1 17.25 10.07 Z";
const STAR = "M28 7.6 Q28.65 10.85 31.9 11.5 Q28.65 12.15 28 15.4 Q27.35 12.15 24.1 11.5 Q27.35 10.85 28 7.6 Z";

/** The Tardemah seal: a crescent cradling a single star. Colours come from CSS (see .logo-mark). */
export function LogoMark({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={"logo-mark " + className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect className="logo-mark-bg" x="1" y="1" width="38" height="38" rx="13" />
      <path className="logo-mark-moon" d={CRESCENT} />
      <path className="logo-mark-star" d={STAR} />
    </svg>
  );
}

export function Logo({
  size = 34,
  hebrew = false,
  className = "",
}: {
  size?: number;
  hebrew?: boolean;
  className?: string;
}) {
  return (
    <span className={"logo " + className}>
      <LogoMark size={size} />
      <span className="logo-word">Tardemah</span>
      {hebrew && (
        <span className="logo-hebrew" lang="he" dir="rtl">
          {HEBREW_NAME}
        </span>
      )}
    </span>
  );
}

const emblemIcons = {
  moon: MoonStar,
  star: Compass,
  eye: Eye,
  flower: Flower2,
  feather: Feather,
  key: KeyRound,
} as const;

export function Emblem({ emblem, size = 16 }: { emblem: string; size?: number }) {
  const Icon = emblemIcons[emblem as keyof typeof emblemIcons];
  return Icon ? <Icon size={size} strokeWidth={1.6} aria-hidden="true" /> : null;
}
