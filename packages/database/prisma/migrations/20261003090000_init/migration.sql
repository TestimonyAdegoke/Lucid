-- Lucid initial Neon/PostgreSQL schema

CREATE TYPE "WorkspaceKind" AS ENUM ('PERSONAL', 'PROFESSIONAL');
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "EntityKind" AS ENUM ('PERSON', 'PLACE', 'OBJECT', 'SYMBOL', 'THEME');
CREATE TYPE "InsightLens" AS ENUM ('PERSONAL_PATTERN', 'PSYCHOLOGICAL', 'SYMBOLIC', 'SPIRITUAL', 'BIBLICAL', 'FREEFORM');
CREATE TYPE "DreamSource" AS ENUM ('WEB', 'MOBILE', 'IMPORT');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "WorkspaceKind" NOT NULL DEFAULT 'PERSONAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JournalPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'lavender',
  "cover" TEXT NOT NULL DEFAULT 'classic',
  "typography" TEXT NOT NULL DEFAULT 'storybook',
  "promptStyle" TEXT NOT NULL DEFAULT 'gentle',
  "pageDensity" TEXT NOT NULL DEFAULT 'airy',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JournalPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dream" (
  "id" TEXT NOT NULL,
  "clientId" TEXT,
  "workspaceId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "dreamedAt" TIMESTAMP(3) NOT NULL,
  "mood" TEXT,
  "vividness" INTEGER,
  "sleepQuality" INTEGER,
  "isLucid" BOOLEAN NOT NULL DEFAULT false,
  "isNightmare" BOOLEAN NOT NULL DEFAULT false,
  "isFavorite" BOOLEAN NOT NULL DEFAULT false,
  "source" "DreamSource" NOT NULL DEFAULT 'WEB',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Dream_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DreamTag" (
  "dreamId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  CONSTRAINT "DreamTag_pkey" PRIMARY KEY ("dreamId", "tagId")
);

CREATE TABLE "DreamEntity" (
  "id" TEXT NOT NULL,
  "dreamId" TEXT NOT NULL,
  "kind" "EntityKind" NOT NULL,
  "label" TEXT NOT NULL,
  "normalized" TEXT,
  "confidence" DOUBLE PRECISION,
  CONSTRAINT "DreamEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DreamInsight" (
  "id" TEXT NOT NULL,
  "dreamId" TEXT NOT NULL,
  "lens" "InsightLens" NOT NULL,
  "content" TEXT NOT NULL,
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DreamInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "DeviceSession_tokenHash_key" ON "DeviceSession"("tokenHash");
CREATE INDEX "DeviceSession_userId_idx" ON "DeviceSession"("userId");
CREATE UNIQUE INDEX "Membership_userId_workspaceId_key" ON "Membership"("userId", "workspaceId");
CREATE INDEX "Membership_workspaceId_idx" ON "Membership"("workspaceId");
CREATE UNIQUE INDEX "JournalPreference_userId_workspaceId_key" ON "JournalPreference"("userId", "workspaceId");
CREATE UNIQUE INDEX "Dream_clientId_key" ON "Dream"("clientId");
CREATE INDEX "Dream_workspaceId_dreamedAt_idx" ON "Dream"("workspaceId", "dreamedAt");
CREATE INDEX "Dream_authorId_idx" ON "Dream"("authorId");
CREATE UNIQUE INDEX "Tag_workspaceId_name_key" ON "Tag"("workspaceId", "name");
CREATE INDEX "DreamTag_tagId_idx" ON "DreamTag"("tagId");
CREATE INDEX "DreamEntity_dreamId_kind_idx" ON "DreamEntity"("dreamId", "kind");
CREATE INDEX "DreamEntity_normalized_idx" ON "DreamEntity"("normalized");
CREATE INDEX "DreamInsight_dreamId_lens_idx" ON "DreamInsight"("dreamId", "lens");

ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalPreference" ADD CONSTRAINT "JournalPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalPreference" ADD CONSTRAINT "JournalPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dream" ADD CONSTRAINT "Dream_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DreamTag" ADD CONSTRAINT "DreamTag_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DreamTag" ADD CONSTRAINT "DreamTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DreamEntity" ADD CONSTRAINT "DreamEntity_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DreamInsight" ADD CONSTRAINT "DreamInsight_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
