import { hasRole, type Role } from "@tardemah/domain";
import { NextResponse } from "next/server";
import type { RequestContext } from "@/lib/session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

/** Wraps a route handler so thrown ApiErrors become JSON responses and anything else becomes a logged 500. */
export function route<Args extends unknown[]>(
  label: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      console.error("Tardemah API failure: " + label, error);
      return NextResponse.json({ error: "Something went wrong in Tardemah. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new ApiError(400, "Tardemah expected a JSON body.");
}

export function requireRole(context: RequestContext, role: Role) {
  if (!hasRole(context.role, role)) {
    throw new ApiError(403, role === "MEMBER"
      ? "You can read this dream book, but not write in it."
      : "Only the book's owner or an admin can do that.", "forbidden");
  }
}

export function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}
