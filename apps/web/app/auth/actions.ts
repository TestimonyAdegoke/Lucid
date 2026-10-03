"use server";

import { auth, isAuthConfigured } from "@/lib/auth/server";
import { revokeCurrentWebDeviceSession } from "@/lib/session";
import { redirect } from "next/navigation";

export type AuthState = { error?: string } | null;

export async function signUpWithEmail(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) {
    return { error: "Neon Auth has not been enabled for this Lucid environment yet." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Add your name, a valid email, and a password of at least 8 characters." };
  }

  const { error } = await auth.signUp.email({ name, email, password });

  if (error) {
    return { error: error.message || "Lucid could not create your account." };
  }

  redirect("/");
}

export async function signInWithEmail(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isAuthConfigured()) {
    return { error: "Neon Auth has not been enabled for this Lucid environment yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await auth.signIn.email({ email, password });

  if (error) {
    return { error: error.message || "Lucid could not sign you in." };
  }

  redirect("/");
}

export async function signOut() {
  if (isAuthConfigured()) {
    try {
      await auth.signOut();
    } catch {
      // The local Lucid device session is still revoked below.
    }
  }

  await revokeCurrentWebDeviceSession();
  redirect("/");
}
