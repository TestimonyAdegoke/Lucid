import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/app/(app)/auth/auth-shell";
import { SignUpForm } from "@/app/(app)/auth/forms";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/journal" } = await searchParams;
  const query = next !== "/journal" ? "?next=" + encodeURIComponent(next) : "";

  return (
    <AuthShell
      eyebrow="Keep my dream book"
      title="Make it yours."
      copy="If you already wrote dreams on this device, creating an account keeps that same journal and lets you carry it with you."
      footer={<span>Already have a Tardemah journal? <Link href={"/auth/sign-in" + query}>Sign in</Link></span>}
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
