import { prisma } from "./db";
import { TRACKED_USERS } from "./config";
import { fetchUserRepos, fetchLiveRepoData } from "./github";
import { filterPotentialSolanaRepos } from "./solana-detector";
import { batchAnalyzeWithAI } from "./ai-analyst";
import type { SolanaProject, ProjectsResponse, GitHubRepo } from "./types";

import { unstable_cache } from "next/cache";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

let pipelineRunning = false;

export async function getSolanaProjects(): Promise<ProjectsResponse> {
  const dbProjects = await prisma.project.findMany({
    where: { isSolanaRelated: true },
    include: {
      contributors: {
        include: { user: true },
      },
    },
  });

  const fullNames = dbProjects.map(p => p.fullName).sort();
  
  // Best practice: Use unstable_cache for persistent server-side caching
  const getCachedLiveData = unstable_cache(
    async (names: string[]) => {
      console.log("[Projects] Fetching fresh live data from GitHub...");
      const map = await fetchLiveRepoData(names);
      return Array.from(map.entries()); // Serializable for cache
    },
    ["github-live-data-v2"],
    { revalidate: 3600, tags: ["projects"] }
  );

  const liveDataEntries = await getCachedLiveData(fullNames);
  const liveDataMap = new Map<string, GitHubRepo>(liveDataEntries);

  const mergedProjects: SolanaProject[] = dbProjects
    .map((p) => {
      const live = liveDataMap.get(p.fullName);
      if (!live) {
        return {
          name: p.fullName.split("/")[1],
          fullName: p.fullName,
          description: p.summary,
          url: `https://github.com/${p.fullName}`,
          homepage: null,
          stars: 0,
          forks: 0,
          openIssues: 0,
          pullRequests: 0,
          languages: [],
          topics: [],
          updatedAt: p.lastScannedAt.toISOString(),
          pushedAt: p.lastScannedAt.toISOString(),
          owner: {
            login: p.ownerLogin,
            avatarUrl: `https://github.com/${p.ownerLogin}.png`,
          },
          category: p.category as SolanaProject["category"],
          summary: p.summary,
          difficulty: p.difficulty as SolanaProject["difficulty"],
          keyFeatures: p.keyFeatures,
          confidence: p.confidence,
          trackedContributors: p.contributors.map((c) => ({
            github: c.user.github,
            name: c.user.name,
            role: c.user.role,
          })),
        };
      };

      return {
        name: live.name,
        fullName: live.fullName,
        description: live.description,
        url: live.url,
        homepage: live.homepage,
        stars: live.stars,
        forks: live.forks,
        openIssues: live.openIssues,
        pullRequests: live.pullRequests,
        languages: live.languages,
        topics: live.topics,
        updatedAt: live.updatedAt,
        pushedAt: live.pushedAt,
        owner: {
          login: live.owner.login,
          avatarUrl: live.owner.avatarUrl,
        },
        category: p.category as SolanaProject["category"],
        summary: p.summary,
        difficulty: p.difficulty as SolanaProject["difficulty"],
        keyFeatures: p.keyFeatures,
        confidence: p.confidence,
        trackedContributors: p.contributors.map((c) => ({
          github: c.user.github,
          name: c.user.name,
          role: c.user.role,
        })),
      };
    })
    .filter((p): p is SolanaProject => p !== null);

  mergedProjects.sort((a, b) => b.stars - a.stars);

  const lastRun = await prisma.pipelineRun.findFirst({
    where: { status: "completed" },
    orderBy: { finishedAt: "desc" },
  });

  const isStale = !lastRun?.finishedAt ||
    Date.now() - lastRun.finishedAt.getTime() > STALE_THRESHOLD_MS;

  if (mergedProjects.length === 0 || (isStale && !pipelineRunning)) {
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

async function runDiscoveryPipeline(): Promise<void> {
  if (pipelineRunning) return;
  pipelineRunning = true;
  const startTime = Date.now();

  const run = await prisma.pipelineRun.create({
    data: { status: "running" },
  });

  try {
    await syncTrackedUsers();

    const userHandles = TRACKED_USERS.map((u) => u.github);
    const repoOwnerMap = new Map<string, GitHubRepo[]>();
    
    for (const handle of userHandles) {
      const repos = await fetchUserRepos(handle);
      repoOwnerMap.set(handle, repos);
    }

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

    const allUniqueRepos = Array.from(repoMap.values()).map(r => r.repo);
    const potentialSolana = await filterPotentialSolanaRepos(allUniqueRepos);
    
    const reposForAI = potentialSolana.map(({ repo, heuristic }) => ({
      repo,
      signals: heuristic.signals,
    }));
    const aiResults = await batchAnalyzeWithAI(reposForAI);

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
