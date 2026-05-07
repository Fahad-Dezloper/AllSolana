-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "ownerLogin" TEXT NOT NULL,
    "isSolanaRelated" BOOLEAN NOT NULL DEFAULT true,
    "confidence" INTEGER NOT NULL DEFAULT 60,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "summary" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL DEFAULT 'Intermediate',
    "keyFeatures" TEXT[],
    "analysisSource" TEXT NOT NULL DEFAULT 'heuristic',
    "lastScannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heuristicScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "github" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Contributor',
    "reposFetched" INTEGER NOT NULL DEFAULT 0,
    "lastFetchedAt" TIMESTAMP(3),

    CONSTRAINT "TrackedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContributor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalReposScanned" INTEGER NOT NULL DEFAULT 0,
    "totalProjectsFound" INTEGER NOT NULL DEFAULT 0,
    "aiAnalysesUsed" INTEGER NOT NULL DEFAULT 0,
    "fallbacksUsed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "error" TEXT,

    CONSTRAINT "PipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_fullName_key" ON "Project"("fullName");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "Project_difficulty_idx" ON "Project"("difficulty");

-- CreateIndex
CREATE INDEX "Project_isSolanaRelated_idx" ON "Project"("isSolanaRelated");

-- CreateIndex
CREATE INDEX "Project_lastScannedAt_idx" ON "Project"("lastScannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedUser_github_key" ON "TrackedUser"("github");

-- CreateIndex
CREATE INDEX "ProjectContributor_projectId_idx" ON "ProjectContributor"("projectId");

-- CreateIndex
CREATE INDEX "ProjectContributor_userId_idx" ON "ProjectContributor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContributor_projectId_userId_key" ON "ProjectContributor"("projectId", "userId");

-- AddForeignKey
ALTER TABLE "ProjectContributor" ADD CONSTRAINT "ProjectContributor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContributor" ADD CONSTRAINT "ProjectContributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TrackedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
