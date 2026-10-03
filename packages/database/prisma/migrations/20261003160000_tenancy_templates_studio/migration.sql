-- CreateEnum
CREATE TYPE "WorkspacePlan" AS ENUM ('FREE', 'PLUS', 'STUDIO');

-- CreateEnum
CREATE TYPE "DreamVisibility" AS ENUM ('PRIVATE', 'WORKSPACE');

-- DropIndex
DROP INDEX "Dream_clientId_key";

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "description" TEXT,
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "plan" "WorkspacePlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "JournalPreference" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "defaultEntryTemplate" TEXT NOT NULL DEFAULT 'sys:quick',
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "paper" TEXT NOT NULL DEFAULT 'lined',
ADD COLUMN     "showOrnaments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "styleKey" TEXT NOT NULL DEFAULT 'lavender-dusk';

-- AlterTable
ALTER TABLE "Dream" ADD COLUMN     "customTemplateId" TEXT,
ADD COLUMN     "fields" JSONB,
ADD COLUMN     "templateKey" TEXT,
ADD COLUMN     "visibility" "DreamVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '✎',
    "prompts" JSONB NOT NULL DEFAULT '[]',
    "defaults" JSONB NOT NULL DEFAULT '{}',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalStyle" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "appearance" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_workspaceId_idx" ON "Invitation"("workspaceId");

-- CreateIndex
CREATE INDEX "EntryTemplate_workspaceId_idx" ON "EntryTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "JournalStyle_workspaceId_idx" ON "JournalStyle"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageCounter_workspaceId_metric_period_key" ON "UsageCounter"("workspaceId", "metric", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Dream_authorId_clientId_key" ON "Dream"("authorId", "clientId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTemplate" ADD CONSTRAINT "EntryTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTemplate" ADD CONSTRAINT "EntryTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalStyle" ADD CONSTRAINT "JournalStyle_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalStyle" ADD CONSTRAINT "JournalStyle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_customTemplateId_fkey" FOREIGN KEY ("customTemplateId") REFERENCES "EntryTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: existing journals keep their look under the matching style preset.
UPDATE "JournalPreference" SET "styleKey" = CASE "theme"
  WHEN 'rose' THEN 'pressed-rose'
  WHEN 'sage' THEN 'quiet-garden'
  WHEN 'midnight' THEN 'stargazer'
  ELSE 'lavender-dusk'
END;
