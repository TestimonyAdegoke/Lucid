import Link from "next/link";
import { auth, isAuthConfigured } from "@/lib/auth/server";
import { signOut } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = isAuthConfigured() ? (await auth.getSession()).data : null;

  return (
    <main className="account-page">
      <section className="account-card">
        <Link className="account-back" href="/">← back to my dream book</Link>
        <p className="eyebrow">My Lucid</p>

        {session?.user ? (
          <>
            <h1>{session.user.name || "My journal"} ♡</h1>
            <p className="account-copy">Your journal is connected to <strong>{session.user.email}</strong>. Dreams can follow you across devices once each device signs in.</p>
            <div className="account-status"><span>☁</span><div><strong>Cloud journal</strong><small>Backed by Neon Postgres + Neon Auth</small></div></div>
            <form action={signOut}><button className="account-signout" type="submit">Sign out on this device</button></form>
          </>
        ) : (
          <>
            <h1>This journal is yours already.</h1>
            <p className="account-copy">You can keep using Lucid privately on this device, or create an account when you want your journal on more than one device.</p>
            <div className="account-actions">
              <Link href="/auth/sign-up">Keep this journal across devices</Link>
              <Link className="secondary" href="/auth/sign-in">I already have an account</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
