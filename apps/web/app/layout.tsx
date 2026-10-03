import type { Metadata, Viewport } from "next";
import {
  Caveat,
  Cormorant_Garamond,
  Courier_Prime,
  EB_Garamond,
  Frank_Ruhl_Libre,
  Fraunces,
  Inter,
  Lora,
  Newsreader,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";
import "./features.css";
import "./auth.css";
import "./graph.css";
import "./landing.css";
import { PwaRegister } from "@/components/pwa-register";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["SOFT", "opsz"] });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", style: ["normal", "italic"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", display: "swap", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"], axes: ["opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", style: ["normal", "italic"] });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", display: "swap", style: ["normal", "italic"] });
// Frank Ruhl Libre carries the Hebrew wordmark (תַּרְדֵּמָה) and the "Scroll" lettering.
const frank = Frank_Ruhl_Libre({ subsets: ["latin", "hebrew"], variable: "--font-frank", display: "swap" });
const courier = Courier_Prime({ subsets: ["latin"], variable: "--font-courier", display: "swap", weight: ["400", "700"], style: ["normal", "italic"] });

const fontVariables = [fraunces, lora, cormorant, caveat, newsreader, inter, playfair, garamond, frank, courier].map((font) => font.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Tardemah — a dream book that remembers with you",
    template: "%s · Tardemah",
  },
  description:
    "Tardemah is a private, beautiful dream journal for web and mobile. Speak or write your dreams the moment you wake, make the book your own, and gently notice what returns.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tardemah",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Tardemah — a dream book that remembers with you",
    description: "Capture dreams by voice or pen, design your own journal, and see the threads between your nights.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4eee8" },
    { media: "(prefers-color-scheme: dark)", color: "#14111d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
