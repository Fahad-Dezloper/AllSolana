/**
 * Main data orchestration layer.
 *
 * Architecture:
 * 1. READ from database first (instant) → serve to frontend
 * 2. If data is stale (>1hr), run discovery pipeline in background
 * 3. Pipeline writes results to DB for next request
 *
 * The page ALWAYS renders instantly from cached DB data.
 */

import { prisma } from "./db";
import { TRACKED_USERS } from "./config";
import { fetchMultipleUsersRepos, fetchGoodFirstIssueCount } from "./github";
import { filterPotentialSolanaRepos } from "./solana-detector";
import { batchAnalyzeWithAI, buildFallbackAnalysis } from "./ai-analyst";
import type { SolanaProject, ProjectsResponse, GitHubRepo } from "./types";

/** How old the data can be before we trigger a background refresh */
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/** Whether a pipeline run is currently in-flight */
let pipelineRunning = false;

// ─────────────────────────────────────────────────────
// PUBLIC API — called by the page
// ─────────────────────────────────────────────────────

/**
 * Get projects from the database. Always returns instantly.
 * Triggers a background refresh if data is stale.
 */
export async function getSolanaProjects(): Promise<ProjectsResponse> {
  // 1. Read from DB
  const dbProjects = await getProjectsFromDB();

  // 2. Check if we need to refresh
  const lastRun = await prisma.pipelineRun.findFirst({
    where: { status: "completed" },
    orderBy: { finishedAt: "desc" },
  });

  const isStale = !lastRun?.finishedAt ||
    Date.now() - lastRun.finishedAt.getTime() > STALE_THRESHOLD_MS;

  const isEmpty = dbProjects.length === 0;

  if (isEmpty) {
    // No data at all — run pipeline synchronously (first-time setup)
    console.log("[Projects] No data in DB. Running initial sync...");
    await runDiscoveryPipeline();
    const freshProjects = await getProjectsFromDB();
    return buildResponse(freshProjects);
  }

  if (isStale && !pipelineRunning) {
    // Data exists but is stale — refresh in background
    console.log("[Projects] Data is stale. Triggering background refresh...");
    runDiscoveryPipeline().catch((err) =>
      console.error("[Projects] Background refresh failed:", err)
    );
  }

  return buildResponse(dbProjects);
}

// ─────────────────────────────────────────────────────
// DATABASE READ
// ─────────────────────────────────────────────────────

async function getProjectsFromDB(): Promise<SolanaProject[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { isSolanaRelated: true },
      include: {
        contributors: {
          include: { user: true },
        },
      },
      orderBy: { stars: "desc" },
    });

    return projects.map((p) => ({
      name: p.name,
      fullName: p.fullName,
      description: p.description,
      url: p.url,
      homepage: p.homepage,
      stars: p.stars,
      forks: p.forks,
      language: p.language,
      topics: p.topics,
      updatedAt: p.ghUpdatedAt ?? p.updatedAt.toISOString(),
      owner: {
        login: p.ownerLogin,
        avatarUrl: p.ownerAvatarUrl,
      },
      category: p.category as SolanaProject["category"],
      summary: p.summary,
      difficulty: p.difficulty as SolanaProject["difficulty"],
      keyFeatures: p.keyFeatures,
      contributionAreas: p.contributionAreas,
      confidence: p.confidence,
      trackedContributors: p.contributors.map((c) => ({
        github: c.user.github,
        name: c.user.name,
        role: c.user.role,
      })),
      goodFirstIssues: p.goodFirstIssues,
    }));
  } catch (error) {
    console.error("[DB] Failed to read projects:", (error as Error).message);
    return [];
  }
}

function buildResponse(projects: SolanaProject[]): ProjectsResponse {
  return {
    projects,
    lastUpdated: new Date().toISOString(),
    totalTrackedUsers: TRACKED_USERS.length,
    totalReposScanned: projects.length,
    isSyncing: pipelineRunning,
  };
}

// ─────────────────────────────────────────────────────
// DISCOVERY PIPELINE → writes to DB
// ─────────────────────────────────────────────────────

async function runDiscoveryPipeline(): Promise<void> {
  if (pipelineRunning) {
    console.log("[Pipeline] Already running, skipping.");
    return;
  }

  pipelineRunning = true;
  const startTime = Date.now();

  // Create pipeline run record
  const run = await prisma.pipelineRun.create({
    data: { status: "running" },
  });

  try {
    console.log(`[Pipeline] Starting for ${TRACKED_USERS.length} tracked users...`);

    // ─── Ensure tracked users exist in DB ───
    await syncTrackedUsers();

    // ─── Step 1: Fetch repos from GitHub ───
    const userRepoMap = await fetchMultipleUsersRepos(
      TRACKED_USERS.map((u) => u.github)
    );

    let totalReposScanned = 0;
    for (const repos of userRepoMap.values()) {
      totalReposScanned += repos.length;
    }
    console.log(`[Pipeline] Fetched ${totalReposScanned} repos in ${Date.now() - startTime}ms`);

    // ─── Step 2: Deduplicate repos ───
    const repoMap = new Map<string, { repo: GitHubRepo; contributors: typeof TRACKED_USERS }>();

    for (const [username, repos] of userRepoMap.entries()) {
      const user = TRACKED_USERS.find((u) => u.github === username);
      if (!user) continue;
      for (const repo of repos) {
        const existing = repoMap.get(repo.fullName);
        if (existing) {
          existing.contributors.push(user);
        } else {
          repoMap.set(repo.fullName, { repo, contributors: [user] });
        }
      }
    }

    console.log(`[Pipeline] ${repoMap.size} unique repos`);

    // ─── Step 3: Heuristic filter ───
    const allRepos = Array.from(repoMap.values()).map((r) => r.repo);
    const potentialSolanaRepos = await filterPotentialSolanaRepos(allRepos);
    console.log(`[Pipeline] ${potentialSolanaRepos.length} repos passed heuristic filter`);

    // ─── Step 4: AI analysis ───
    const reposForAI = potentialSolanaRepos.map(({ repo, heuristic }) => ({
      repo,
      signals: heuristic.signals,
    }));

    let aiCount = 0;
    let fallbackCount = 0;
    const aiResults = await batchAnalyzeWithAI(reposForAI);

    // ─── Step 5: Batch fetch good-first-issues ───
    const topRepos = potentialSolanaRepos.slice(0, 20);
    const issueCounts = await Promise.all(
      topRepos.map(({ repo }) =>
        fetchGoodFirstIssueCount(repo.owner.login, repo.name).catch(() => 0)
      )
    );
    const issueCountMap = new Map<string, number>();
    topRepos.forEach(({ repo }, i) => {
      issueCountMap.set(repo.fullName, issueCounts[i]);
    });

    // ─── Step 6: Write to database ───
    let projectsFound = 0;

    for (const { repo, heuristic } of potentialSolanaRepos) {
      const analysis = aiResults.get(repo.fullName);
      if (!analysis || !analysis.isSolanaRelated) continue;

      const isAI = analysis.confidence > 60;
      if (isAI) aiCount++;
      else fallbackCount++;

      const contributors = repoMap.get(repo.fullName)?.contributors ?? [];

      // Upsert the project
      const project = await prisma.project.upsert({
        where: { fullName: repo.fullName },
        update: {
          description: repo.description,
          url: repo.url,
          homepage: repo.homepage,
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language,
          topics: repo.topics,
          isFork: repo.isFork,
          isArchived: repo.isArchived,
          pushedAt: repo.pushedAt,
          ghUpdatedAt: repo.updatedAt,
          ownerLogin: repo.owner.login,
          ownerAvatarUrl: repo.owner.avatarUrl,
          defaultBranch: repo.defaultBranch,
          isSolanaRelated: analysis.isSolanaRelated,
          confidence: analysis.confidence,
          category: analysis.category,
          summary: analysis.summary,
          difficulty: analysis.difficulty,
          keyFeatures: analysis.keyFeatures,
          contributionAreas: analysis.contributionAreas,
          analysisSource: isAI ? "ai" : "heuristic",
          goodFirstIssues: issueCountMap.get(repo.fullName) ?? 0,
          lastScannedAt: new Date(),
          heuristicScore: heuristic.confidence,
        },
        create: {
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          url: repo.url,
          homepage: repo.homepage,
          stars: repo.stars,
          forks: repo.forks,
          language: repo.language,
          topics: repo.topics,
          isFork: repo.isFork,
          isArchived: repo.isArchived,
          pushedAt: repo.pushedAt,
          ghUpdatedAt: repo.updatedAt,
          ownerLogin: repo.owner.login,
          ownerAvatarUrl: repo.owner.avatarUrl,
          defaultBranch: repo.defaultBranch,
          isSolanaRelated: analysis.isSolanaRelated,
          confidence: analysis.confidence,
          category: analysis.category,
          summary: analysis.summary,
          difficulty: analysis.difficulty,
          keyFeatures: analysis.keyFeatures,
          contributionAreas: analysis.contributionAreas,
          analysisSource: isAI ? "ai" : "heuristic",
          goodFirstIssues: issueCountMap.get(repo.fullName) ?? 0,
          heuristicScore: heuristic.confidence,
        },
      });

      // Link contributors
      for (const contributor of contributors) {
        const dbUser = await prisma.trackedUser.findUnique({
          where: { github: contributor.github },
        });
        if (dbUser) {
          await prisma.projectContributor.upsert({
            where: {
              projectId_userId: {
                projectId: project.id,
                userId: dbUser.id,
              },
            },
            update: {},
            create: {
              projectId: project.id,
              userId: dbUser.id,
            },
          });
        }
      }

      projectsFound++;
    }

    // ─── Step 7: Update pipeline run record ───
    const durationMs = Date.now() - startTime;
    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        totalReposScanned,
        totalProjectsFound: projectsFound,
        aiAnalysesUsed: aiCount,
        fallbacksUsed: fallbackCount,
        durationMs,
      },
    });

    console.log(`[Pipeline] ✓ Done: ${projectsFound} projects saved in ${durationMs}ms (${aiCount} AI, ${fallbackCount} fallback)`);
  } catch (error) {
    console.error("[Pipeline] Failed:", (error as Error).message);
    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        durationMs: Date.now() - startTime,
        error: (error as Error).message.slice(0, 500),
      },
    });
  } finally {
    pipelineRunning = false;
  }
}

/**
 * Ensure all TRACKED_USERS from config exist in the database.
 */
async function syncTrackedUsers() {
  for (const user of TRACKED_USERS) {
    await prisma.trackedUser.upsert({
      where: { github: user.github },
      update: { name: user.name, role: user.role },
      create: { github: user.github, name: user.name, role: user.role },
    });
  }
}
