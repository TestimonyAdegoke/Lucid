import { db } from "@tardemah/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      database: "neon-postgres",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable",
      },
      { status: 503 },
    );
  }
}
