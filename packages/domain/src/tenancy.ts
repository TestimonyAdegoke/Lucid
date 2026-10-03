export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type Plan = "FREE" | "PLUS" | "STUDIO";

const roleRank: Record<Role, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };

export function hasRole(actual: Role, required: Role) {
  return roleRank[actual] >= roleRank[required];
}

/** Admins may assign any role below their own; owners may assign anything except transferring ownership implicitly. */
export function canAssignRole(actor: Role, target: Role) {
  if (actor === "OWNER") return target !== "OWNER";
  if (actor === "ADMIN") return roleRank[target] < roleRank.ADMIN;
  return false;
}

export type Entitlements = {
  transcriptionsPerMonth: number;
  customEntryTemplates: number;
  customStyles: number;
  ownedSharedWorkspaces: number;
  membersPerWorkspace: number;
};

export const planEntitlements: Record<Plan, Entitlements> = {
  FREE: { transcriptionsPerMonth: 30, customEntryTemplates: 5, customStyles: 3, ownedSharedWorkspaces: 1, membersPerWorkspace: 5 },
  PLUS: { transcriptionsPerMonth: 400, customEntryTemplates: 50, customStyles: 30, ownedSharedWorkspaces: 5, membersPerWorkspace: 20 },
  STUDIO: { transcriptionsPerMonth: 3000, customEntryTemplates: 200, customStyles: 100, ownedSharedWorkspaces: 25, membersPerWorkspace: 200 },
};

export const planLabels: Record<Plan, { name: string; blurb: string }> = {
  FREE: { name: "Free", blurb: "A private dream book with voice capture." },
  PLUS: { name: "Plus", blurb: "More voice capture, unlimited-feeling templates and shared books." },
  STUDIO: { name: "Studio", blurb: "For dream circles, researchers and practitioners." },
};

export function usagePeriod(date = new Date()) {
  return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0");
}
