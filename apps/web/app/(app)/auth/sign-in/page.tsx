import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/app/(app)/auth/auth-shell";
import { SignInForm } from "@/app/(app)/auth/forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/journal" } = await searchParams;
  const query = next !== "/journal" ? "?next=" + encodeURIComponent(next) : "";

  return (
    <AuthShell
      eyebrow="Open my dream book"
      title="Welcome back ♡"
      copy="Sign in to find the same journal on every device."
      footer={<span>New to Tardemah? <Link href={"/auth/sign-up" + query}>Make this journal yours</Link></span>}
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
