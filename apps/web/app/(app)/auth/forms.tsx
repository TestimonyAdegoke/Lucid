"use client";

import { useActionState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/app/(app)/auth/actions";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithEmail, null);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label>
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label>
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </label>
      {state?.error && <div className="auth-error" role="alert">{state.error}</div>}
      <button type="submit" disabled={pending}>{pending ? "Opening your journal…" : "Open my journal"}</button>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpWithEmail, null);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <label>
        <span>What should Tardemah call you?</span>
        <input type="text" name="name" autoComplete="name" required placeholder="Your name" />
      </label>
      <label>
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required placeholder="you@example.com" />
      </label>
      <label>
        <span>Password</span>
        <input type="password" name="password" autoComplete="new-password" minLength={8} required placeholder="At least 8 characters" />
      </label>
      {state?.error && <div className="auth-error" role="alert">{state.error}</div>}
      <button type="submit" disabled={pending}>{pending ? "Binding your journal…" : "Keep my journal"}</button>
    </form>
  );
}
