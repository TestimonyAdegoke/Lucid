import type { Metadata } from "next";
import { AuthShell } from "@/app/(app)/auth/auth-shell";
import { InviteAccept } from "@/components/invite-accept";

export const metadata: Metadata = { title: "You're invited" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <AuthShell
      eyebrow="An invitation"
      title="A shared dream book."
      copy="Pages you write stay private to you unless you choose to share them with the book."
      footer={<span>Tardemah never shares a page you haven&apos;t chosen to share.</span>}
    >
      <InviteAccept token={token} />
    </AuthShell>
  );
}
