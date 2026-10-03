import type { Metadata } from "next";
import { JournalShell } from "@/components/journal-shell";

export const metadata: Metadata = { title: "My dream book" };

export default function JournalPage() {
  return <JournalShell />;
}
