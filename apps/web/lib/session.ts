import { createHash, randomBytes } from "node:crypto";
import { db, MembershipRole, WorkspaceKind } from "@lucid/database";
import { cookies } from "next/headers";
import { getOptionalAuthSession } from "@/lib/auth/server";

const COOKIE_NAME = "lucid_session";
const SESSION_HEADER = "x-lucid-session";
const CLIENT_HEADER = "x-lucid-client";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validToken(token: string | null | undefined): token is string {
  return typeof token === "string" && token.length >= 32 && token.length <= 256;
}

async function resolveToken(request: Request) {
  const headerToken = request.headers.get(SESSION_HEADER);

  if (validToken(headerToken)) {
    return {
      token: headerToken,
      client: request.headers.get(CLIENT_HEADER) === "mobile" ? "mobile" : "web",
    } as const;
  }

  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  if (!validToken(token)) {
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

async function firstOwnerWorkspace(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId, role: MembershipRole.OWNER },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspaceId ?? null;
}

async function createUserContext(
  tokenHash: string,
  client: "web" | "mobile",
  identity?: { authUserId?: string; email?: string | null; name?: string | null },
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        authUserId: identity?.authUserId,
        email: identity?.email ?? null,
        name: identity?.name ?? null,
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
      authenticated: Boolean(identity?.authUserId),
    };
  });
}

export async function getRequestContext(request: Request) {
  const { token, client } = await resolveToken(request);
  const tokenHash = hashToken(token);

  const existingDevice = await db.deviceSession.findUnique({
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

  const authSession = await getOptionalAuthSession();
  const authUser = authSession?.user;

  if (authUser?.id) {
    const linkedUser = await db.user.findUnique({
      where: { authUserId: authUser.id },
    });

    if (linkedUser) {
      if (existingDevice?.userId !== linkedUser.id) {
        await db.deviceSession.upsert({
          where: { tokenHash },
          update: {
            userId: linkedUser.id,
            label: client === "mobile" ? "Lucid mobile" : "Lucid web",
          },
          create: {
            userId: linkedUser.id,
            tokenHash,
            label: client === "mobile" ? "Lucid mobile" : "Lucid web",
          },
        });
      }

      let workspaceId = await firstOwnerWorkspace(linkedUser.id);
      if (!workspaceId) {
        const created = await createUserContext(
          randomBytes(32).toString("hex"),
          client,
          {
            authUserId: authUser.id,
            email: authUser.email ?? null,
            name: authUser.name ?? null,
          },
        );
        workspaceId = created.workspaceId;
      }

      return {
        userId: linkedUser.id,
        workspaceId,
        client,
        authenticated: true,
      };
    }

    if (existingDevice) {
      const membership = existingDevice.user.memberships[0];

      await db.user.update({
        where: { id: existingDevice.userId },
        data: {
          authUserId: authUser.id,
          email: authUser.email ?? existingDevice.user.email,
          name: authUser.name ?? existingDevice.user.name,
        },
      });

      if (membership) {
        return {
          userId: existingDevice.userId,
          workspaceId: membership.workspaceId,
          client,
          authenticated: true,
        };
      }
    }

    return createUserContext(tokenHash, client, {
      authUserId: authUser.id,
      email: authUser.email ?? null,
      name: authUser.name ?? null,
    });
  }

  const membership = existingDevice?.user.memberships[0];

  if (existingDevice && membership) {
    return {
      userId: existingDevice.userId,
      workspaceId: membership.workspaceId,
      client,
      authenticated: Boolean(existingDevice.user.authUserId),
    };
  }

  try {
    return await createUserContext(tokenHash, client);
  } catch (error) {
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
        authenticated: Boolean(raced.user.authUserId),
      };
    }

    throw error;
  }
}

export async function revokeCurrentWebDeviceSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (validToken(token)) {
    await db.deviceSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
