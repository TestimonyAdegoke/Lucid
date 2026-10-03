import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./features.css";
import "./auth.css";
import "./graph.css";

export const metadata: Metadata = {
  title: "Lucid — Your dream journal",
  description: "A private, personal place to remember the world you visit when you sleep.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#8f78b8",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
