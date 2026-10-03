CREATE TABLE "DreamConnection" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "fromDreamId" TEXT NOT NULL,
  "toDreamId" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "sharedEntities" JSONB NOT NULL DEFAULT '[]',
  "sharedTags" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DreamConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DreamConnection_fromDreamId_toDreamId_key" ON "DreamConnection"("fromDreamId", "toDreamId");
CREATE INDEX "DreamConnection_workspaceId_score_idx" ON "DreamConnection"("workspaceId", "score");
CREATE INDEX "DreamConnection_toDreamId_idx" ON "DreamConnection"("toDreamId");

ALTER TABLE "DreamConnection"
  ADD CONSTRAINT "DreamConnection_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DreamConnection"
  ADD CONSTRAINT "DreamConnection_fromDreamId_fkey"
  FOREIGN KEY ("fromDreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DreamConnection"
  ADD CONSTRAINT "DreamConnection_toDreamId_fkey"
  FOREIGN KEY ("toDreamId") REFERENCES "Dream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
