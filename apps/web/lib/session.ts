import { createHash, randomBytes } from "node:crypto";
import { db, MembershipRole, WorkspaceKind } from "@tardemah/database";
import type { Role } from "@tardemah/domain";
import { cookies } from "next/headers";
import { getOptionalAuthSession } from "@/lib/auth/server";

const COOKIE_NAME = "tardemah_session";
export const WORKSPACE_COOKIE = "tardemah_workspace";
const SESSION_HEADER = "x-tardemah-session";
const CLIENT_HEADER = "x-tardemah-client";
const WORKSPACE_HEADER = "x-tardemah-workspace";

// Names from before the rename to Tardemah. Still honoured so existing devices and
// already-installed mobile builds keep their journals; legacy cookies are migrated on first use.
const LEGACY_COOKIE_NAME = "lucid_session";
const LEGACY_WORKSPACE_COOKIE = "lucid_workspace";
const LEGACY_SESSION_HEADER = "x-lucid-session";
const LEGACY_CLIENT_HEADER = "x-lucid-client";
const LEGACY_WORKSPACE_HEADER = "x-lucid-workspace";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export function workspaceCookieOptions() {
  return cookieOptions;
}

function header(request: Request, name: string, legacy: string) {
  return request.headers.get(name) ?? request.headers.get(legacy);
}

type Client = "web" | "mobile";

export type RequestContext = {
  userId: string;
  workspaceId: string;
  personalWorkspaceId: string;
  role: Role;
  client: Client;
  authenticated: boolean;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validToken(token: string | null | undefined): token is string {
  return typeof token === "string" && token.length >= 32 && token.length <= 256;
}

function deviceLabel(client: Client) {
  return client === "mobile" ? "Tardemah mobile" : "Tardemah web";
}

async function resolveToken(request: Request) {
  const headerToken = header(request, SESSION_HEADER, LEGACY_SESSION_HEADER);

  if (validToken(headerToken)) {
    return {
      token: headerToken,
      client: (header(request, CLIENT_HEADER, LEGACY_CLIENT_HEADER) === "mobile" ? "mobile" : "web") as Client,
    };
  }

  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  if (!validToken(token)) {
    const legacy = cookieStore.get(LEGACY_COOKIE_NAME)?.value;
    token = validToken(legacy) ? legacy : randomBytes(32).toString("base64url");
    cookieStore.set(COOKIE_NAME, token, cookieOptions);
    if (legacy) cookieStore.delete(LEGACY_COOKIE_NAME);
  }

  return { token, client: "web" as Client };
}

/** Every user owns exactly one personal dream book. Creates it if it is missing. */
async function ensurePersonalWorkspace(userId: string) {
  const existing = await db.membership.findFirst({
    where: { userId, role: MembershipRole.OWNER, workspace: { kind: WorkspaceKind.PERSONAL } },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (existing) return existing.workspaceId;

  return db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name: "My Dream Book", kind: WorkspaceKind.PERSONAL, emoji: "☾" },
    });
    await tx.membership.create({
      data: { userId, workspaceId: workspace.id, role: MembershipRole.OWNER },
    });
    await tx.journalPreference.create({ data: { userId, workspaceId: workspace.id } });
    return workspace.id;
  });
}

async function createUser(
  tokenHash: string,
  client: Client,
  identity?: { authUserId: string; email: string | null; name: string | null },
) {
  const user = await db.user.create({
    data: {
      authUserId: identity?.authUserId,
      email: identity?.email ?? null,
      name: identity?.name ?? null,
    },
  });

  // The device may already exist (e.g. it belonged to a different account); point it at the new user.
  await db.deviceSession.upsert({
    where: { tokenHash },
    update: { userId: user.id, label: deviceLabel(client) },
    create: { userId: user.id, tokenHash, label: deviceLabel(client) },
  });

  return user.id;
}

async function findDevice(tokenHash: string) {
  return db.deviceSession.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, authUserId: true, email: true, name: true } } },
  });
}

async function resolveIdentity(tokenHash: string, client: Client) {
  const existingDevice = await findDevice(tokenHash);
  const authUser = (await getOptionalAuthSession())?.user;

  if (authUser?.id) {
    const linkedUser = await db.user.findUnique({ where: { authUserId: authUser.id }, select: { id: true } });

    if (linkedUser) {
      if (existingDevice?.userId !== linkedUser.id) {
        await db.deviceSession.upsert({
          where: { tokenHash },
          update: { userId: linkedUser.id, label: deviceLabel(client) },
          create: { userId: linkedUser.id, tokenHash, label: deviceLabel(client) },
        });
      }
      return { userId: linkedUser.id, authenticated: true };
    }

    // Claim the anonymous journal on this device — but never a journal that already belongs to another account.
    if (existingDevice && !existingDevice.user.authUserId) {
      await db.user.update({
        where: { id: existingDevice.userId },
        data: {
          authUserId: authUser.id,
          email: authUser.email ?? existingDevice.user.email,
          name: authUser.name ?? existingDevice.user.name,
        },
      });
      return { userId: existingDevice.userId, authenticated: true };
    }

    const userId = await createUser(tokenHash, client, {
      authUserId: authUser.id,
      email: authUser.email ?? null,
      name: authUser.name ?? null,
    });
    return { userId, authenticated: true };
  }

  if (existingDevice) {
    return { userId: existingDevice.userId, authenticated: Boolean(existingDevice.user.authUserId) };
  }

  try {
    return { userId: await createUser(tokenHash, client), authenticated: false };
  } catch (error) {
    // Two first requests from a brand-new device can race; the loser adopts the winner's user.
    const raced = await findDevice(tokenHash);
    if (raced) return { userId: raced.userId, authenticated: Boolean(raced.user.authUserId) };
    throw error;
  }
}

async function requestedWorkspaceId(request: Request) {
  const fromHeader = header(request, WORKSPACE_HEADER, LEGACY_WORKSPACE_HEADER);
  if (fromHeader) return fromHeader;
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? cookieStore.get(LEGACY_WORKSPACE_COOKIE)?.value ?? null;
}

/**
 * Resolves who is calling and which dream book (tenant) they are acting in.
 * Every data query must be scoped by the returned workspaceId, and writes must check `role`.
 */
export async function getRequestContext(request: Request): Promise<RequestContext> {
  const { token, client } = await resolveToken(request);
  const { userId, authenticated } = await resolveIdentity(hashToken(token), client);

  let personalWorkspaceId: string;
  try {
    personalWorkspaceId = await ensurePersonalWorkspace(userId);
  } catch {
    // A concurrent request may have just created it.
    personalWorkspaceId = await ensurePersonalWorkspace(userId);
  }

  const requested = await requestedWorkspaceId(request);
  if (requested && requested !== personalWorkspaceId) {
    const membership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: requested } },
      select: { role: true },
    });
    if (membership) {
      return { userId, workspaceId: requested, personalWorkspaceId, role: membership.role, client, authenticated };
    }
  }

  return { userId, workspaceId: personalWorkspaceId, personalWorkspaceId, role: "OWNER", client, authenticated };
}

export async function revokeCurrentWebDeviceSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? cookieStore.get(LEGACY_COOKIE_NAME)?.value;

  if (validToken(token)) {
    await db.deviceSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(WORKSPACE_COOKIE);
  cookieStore.delete(LEGACY_COOKIE_NAME);
  cookieStore.delete(LEGACY_WORKSPACE_COOKIE);
}

/** True when this browser already has a Tardemah journal (used by the landing page; no database access). */
export async function hasJournalCookie() {
  const cookieStore = await cookies();
  return validToken(cookieStore.get(COOKIE_NAME)?.value) || validToken(cookieStore.get(LEGACY_COOKIE_NAME)?.value);
}
