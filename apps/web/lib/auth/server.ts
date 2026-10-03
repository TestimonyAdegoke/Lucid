import { createNeonAuth } from "@neondatabase/auth/next/server";

const fallbackBaseUrl = "https://auth-not-configured.invalid";
const fallbackSecret = "lucid-development-cookie-secret-change-me-123456789";

export function isAuthConfigured() {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_COOKIE_SECRET.length >= 32
  );
}

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? fallbackBaseUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? fallbackSecret,
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "silent",
});

export async function getOptionalAuthSession() {
  if (!isAuthConfigured()) return null;

  try {
    const { data } = await auth.getSession();
    return data ?? null;
  } catch {
    return null;
  }
}
