import type { Metadata } from "next";
import { appearanceBootScript } from "@/lib/client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      <div className="app-root">{children}</div>
    </>
  );
}
