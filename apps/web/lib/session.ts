import { createHash, randomBytes } from "node:crypto";
import { db, MembershipRole, WorkspaceKind } from "@lucid/database";
import { cookies } from "next/headers";

const COOKIE_NAME = "lucid_session";
const SESSION_HEADER = "x-lucid-session";
const CLIENT_HEADER = "x-lucid-client";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validToken(token: string | null) {
  return Boolean(token && token.length >= 32 && token.length <= 256);
}

async function resolveToken(request: Request) {
  const headerToken = request.headers.get(SESSION_HEADER);

  if (validToken(headerToken)) {
    return {
      token: headerToken!,
      client: request.headers.get(CLIENT_HEADER) === "mobile" ? "mobile" : "web",
    } as const;
  }

  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  if (!validToken(token ?? null)) {
    token = randomBytes(32).toString("base64url");
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return { token, client: "web" as const };
}

async function createAnonymousContext(tokenHash: string, client: "web" | "mobile") {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: null,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: "My Dream Book",
        kind: WorkspaceKind.PERSONAL,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: MembershipRole.OWNER,
      },
    });

    await tx.journalPreference.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    });

    await tx.deviceSession.create({
      data: {
        userId: user.id,
        tokenHash,
        label: client === "mobile" ? "Lucid mobile" : "Lucid web",
      },
    });

    return {
      userId: user.id,
      workspaceId: workspace.id,
      client,
    };
  });
}

export async function getRequestContext(request: Request) {
  const { token, client } = await resolveToken(request);
  const tokenHash = hashToken(token);

  const existing = await db.deviceSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            where: { role: MembershipRole.OWNER },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const membership = existing?.user.memberships[0];

  if (existing && membership) {
    return {
      userId: existing.userId,
      workspaceId: membership.workspaceId,
      client,
    };
  }

  try {
    return await createAnonymousContext(tokenHash, client);
  } catch (error) {
    // A duplicate token can occur if two first-load requests race. Re-read it.
    const raced = await db.deviceSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              where: { role: MembershipRole.OWNER },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    const racedMembership = raced?.user.memberships[0];
    if (raced && racedMembership) {
      return {
        userId: raced.userId,
        workspaceId: racedMembership.workspaceId,
        client,
      };
    }

    throw error;
  }
}
