"use server";

import { auth, isAuthConfigured } from "@/lib/auth/server";
import { revokeCurrentWebDeviceSession } from "@/lib/session";
import { redirect } from "next/navigation";

export type AuthState = { error?: string } | null;

/** Only same-site relative paths are allowed as post-auth destinations (no open redirects). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/journal";
}

export async function signUpWithEmail(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) {
    return { error: "Accounts have not been enabled for this Tardemah environment yet." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Add your name, a valid email, and a password of at least 8 characters." };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) return { error: error.message || "Tardemah could not create your account." };

  redirect(safeNext(formData.get("next")));
}

export async function signInWithEmail(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) {
    return { error: "Accounts have not been enabled for this Tardemah environment yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await auth.signIn.email({ email, password });
  if (error) return { error: error.message || "Tardemah could not sign you in." };

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  if (isAuthConfigured()) {
    try {
      await auth.signOut();
    } catch {
      // The local Tardemah device session is still revoked below.
    }
  }

  await revokeCurrentWebDeviceSession();
  redirect("/");
}
