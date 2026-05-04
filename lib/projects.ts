import { prisma } from "./db";
import { TRACKED_USERS } from "./config";
import { fetchUserRepos, fetchLiveRepoData } from "./github";
import { filterPotentialSolanaRepos } from "./solana-detector";
import { batchAnalyzeWithAI } from "./ai-analyst";
import type { SolanaProject, ProjectsResponse, GitHubRepo } from "./types";

/** How old the discovery pipeline results can be before we trigger a background refresh */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours (Identity doesn't change often)

/** Whether a pipeline run is currently in-flight */
let pipelineRunning = false;

// ─────────────────────────────────────────────────────
// PUBLIC API — called by the page
// ─────────────────────────────────────────────────────

/**
 * Get projects from the database and enrich them with LIVE data from GitHub.
 */
export async function getSolanaProjects(): Promise<ProjectsResponse> {
  // 1. Read project identities and AI metadata from DB
  const dbProjects = await prisma.project.findMany({
    where: { isSolanaRelated: true },
    include: {
      contributors: {
        include: { user: true },
      },
    },
  });

  // 2. Fetch LIVE stats for all these projects from GitHub
  const fullNames = dbProjects.map(p => p.fullName);
  const liveDataMap = await fetchLiveRepoData(fullNames);

  // 3. Merge DB data with live GitHub data
  const mergedProjects: SolanaProject[] = dbProjects
    .map((p) => {
      const live = liveDataMap.get(p.fullName);
      if (!live) return null; // If repo was deleted or renamed, skip for now

      return {
        // Live Data
        name: live.name,
        fullName: live.fullName,
        description: live.description,
        url: live.url,
        homepage: live.homepage,
        stars: live.stars,
        forks: live.forks,
        openIssues: live.openIssues,
        languages: live.languages,
        topics: live.topics,
        updatedAt: live.updatedAt,
        pushedAt: live.pushedAt,
        owner: {
          login: live.owner.login,
          avatarUrl: live.owner.avatarUrl,
        },

        // AI Analysis (Persistent)
        category: p.category as SolanaProject["category"],
        summary: p.summary,
        difficulty: p.difficulty as SolanaProject["difficulty"],
        keyFeatures: p.keyFeatures,
        confidence: p.confidence,

        // Contributors
        trackedContributors: p.contributors.map((c) => ({
          github: c.user.github,
          name: c.user.name,
          role: c.user.role,
        })),
      };
    })
    .filter((p): p is SolanaProject => p !== null);

  // 4. Sort by live stars (descending)
  mergedProjects.sort((a, b) => b.stars - a.stars);

  // 5. Check if we need to refresh the discovery pipeline
  const lastRun = await prisma.pipelineRun.findFirst({
    where: { status: "completed" },
    orderBy: { finishedAt: "desc" },
  });

  const isStale = !lastRun?.finishedAt ||
    Date.now() - lastRun.finishedAt.getTime() > STALE_THRESHOLD_MS;

  if (mergedProjects.length === 0 || (isStale && !pipelineRunning)) {
    console.log("[Projects] Discovery stale or empty. Triggering refresh...");
    runDiscoveryPipeline().catch((err) =>
      console.error("[Projects] Background refresh failed:", err)
    );
  }

  return {
    projects: mergedProjects,
    lastUpdated: new Date().toISOString(),
    totalTrackedUsers: TRACKED_USERS.length,
    totalReposScanned: mergedProjects.length,
    isSyncing: pipelineRunning,
  };
}

// ─────────────────────────────────────────────────────
// DISCOVERY PIPELINE → writes project identity & AI info to DB
// ─────────────────────────────────────────────────────

async function runDiscoveryPipeline(): Promise<void> {
  if (pipelineRunning) return;
  pipelineRunning = true;
  const startTime = Date.now();

  const run = await prisma.pipelineRun.create({
    data: { status: "running" },
  });

  try {
    await syncTrackedUsers();

    // Fetch all repos for all tracked users
    const userHandles = TRACKED_USERS.map((u) => u.github);
    const repoOwnerMap = new Map<string, GitHubRepo[]>();
    
    for (const handle of userHandles) {
      const repos = await fetchUserRepos(handle);
      repoOwnerMap.set(handle, repos);
    }

    // Deduplicate
    const repoMap = new Map<string, { repo: GitHubRepo; contributors: typeof TRACKED_USERS }>();
    let totalScanned = 0;

    for (const [handle, repos] of repoOwnerMap.entries()) {
      totalScanned += repos.length;
      const user = TRACKED_USERS.find((u) => u.github === handle)!;
      for (const repo of repos) {
        const existing = repoMap.get(repo.fullName);
        if (existing) {
          existing.contributors.push(user);
        } else {
          repoMap.set(repo.fullName, { repo, contributors: [user] });
        }
      }
    }

    // Heuristics
    const allUniqueRepos = Array.from(repoMap.values()).map(r => r.repo);
    const potentialSolana = await filterPotentialSolanaRepos(allUniqueRepos);
    
    // AI Analysis
    const reposForAI = potentialSolana.map(({ repo, heuristic }) => ({
      repo,
      signals: heuristic.signals,
    }));
    const aiResults = await batchAnalyzeWithAI(reposForAI);

    // Persist
    let projectsFound = 0;
    let aiCount = 0;
    let fallbackCount = 0;

    for (const { repo, heuristic } of potentialSolana) {
      const analysis = aiResults.get(repo.fullName);
      if (!analysis || !analysis.isSolanaRelated) continue;

      const isAI = analysis.confidence > 60;
      if (isAI) aiCount++; else fallbackCount++;

      const project = await prisma.project.upsert({
        where: { fullName: repo.fullName },
        update: {
          ownerLogin: repo.owner.login,
          isSolanaRelated: true,
          confidence: analysis.confidence,
          category: analysis.category,
          summary: analysis.summary,
          difficulty: analysis.difficulty,
          keyFeatures: analysis.keyFeatures,
          analysisSource: isAI ? "ai" : "heuristic",
          lastScannedAt: new Date(),
          heuristicScore: heuristic.confidence,
        },
        create: {
          fullName: repo.fullName,
          ownerLogin: repo.owner.login,
          isSolanaRelated: true,
          confidence: analysis.confidence,
          category: analysis.category,
          summary: analysis.summary,
          difficulty: analysis.difficulty,
          keyFeatures: analysis.keyFeatures,
          analysisSource: isAI ? "ai" : "heuristic",
          heuristicScore: heuristic.confidence,
        },
      });

      // Link contributors
      const contributors = repoMap.get(repo.fullName)?.contributors ?? [];
      for (const c of contributors) {
        const dbUser = await prisma.trackedUser.findUnique({ where: { github: c.github } });
        if (dbUser) {
          await prisma.projectContributor.upsert({
            where: { projectId_userId: { projectId: project.id, userId: dbUser.id } },
            update: {},
            create: { projectId: project.id, userId: dbUser.id },
          });
        }
      }
      projectsFound++;
    }

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        totalReposScanned: totalScanned,
        totalProjectsFound: projectsFound,
        aiAnalysesUsed: aiCount,
        fallbacksUsed: fallbackCount,
        durationMs: Date.now() - startTime,
      },
    });
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

async function syncTrackedUsers() {
  for (const user of TRACKED_USERS) {
    await prisma.trackedUser.upsert({
      where: { github: user.github },
      update: { name: user.name, role: user.role },
      create: { github: user.github, name: user.name, role: user.role },
    });
  }
}
