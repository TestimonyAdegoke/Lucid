import { db } from "@tardemah/database";
import { planEntitlements, usagePeriod, type Entitlements, type Plan } from "@tardemah/domain";
import { ApiError } from "@/lib/api";

export async function workspaceEntitlements(workspaceId: string): Promise<{ plan: Plan; limits: Entitlements }> {
  const workspace = await db.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } });
  const plan = (workspace?.plan ?? "FREE") as Plan;
  return { plan, limits: planEntitlements[plan] };
}

/**
 * Atomically consumes one unit of a monthly metered resource, refusing once the limit is reached.
 * The conditional upsert makes concurrent requests unable to overshoot the limit.
 */
export async function consumeMonthlyUsage(workspaceId: string, metric: string, limit: number) {
  const period = usagePeriod();
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "UsageCounter" ("id", "workspaceId", "metric", "period", "count", "updatedAt")
    VALUES (${"usage_" + crypto.randomUUID()}, ${workspaceId}, ${metric}, ${period}, 1, NOW())
    ON CONFLICT ("workspaceId", "metric", "period")
    DO UPDATE SET "count" = "UsageCounter"."count" + 1, "updatedAt" = NOW()
    WHERE "UsageCounter"."count" < ${limit}
    RETURNING "count"
  `;

  if (!rows.length) {
    throw new ApiError(429, "This dream book has used its voice captures for the month. Typing still works, always.", "quota");
  }
}

/** Gives back a unit when the metered work failed (e.g. the transcription provider errored). */
export async function refundMonthlyUsage(workspaceId: string, metric: string) {
  await db.usageCounter.updateMany({
    where: { workspaceId, metric, period: usagePeriod(), count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

export async function monthlyUsage(workspaceId: string, metric: string) {
  const counter = await db.usageCounter.findUnique({
    where: { workspaceId_metric_period: { workspaceId, metric, period: usagePeriod() } },
    select: { count: true },
  });
  return counter?.count ?? 0;
}
