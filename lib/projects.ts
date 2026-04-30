/**
 * Main data orchestration layer.
 *
 * This is the entry point for the frontend. It ties together:
 * 1. GitHub data fetching
 * 2. Heuristic filtering
 * 3. AI analysis
 * 4. Caching via Next.js 16 'use cache'
 */

import { TRACKED_USERS } from "./config";
import { fetchUserRepos, fetchGoodFirstIssueCount } from "./github";
import { filterPotentialSolanaRepos } from "./solana-detector";
import { batchAnalyzeWithAI } from "./ai-analyst";
import type { SolanaProject, ProjectsResponse, GitHubRepo } from "./types";

/**
 * The main pipeline:
 * 1. Fetch repos from all tracked users
 * 2. Run heuristic filter (fast)
 * 3. Send filtered repos to Gemini for AI analysis
 * 4. Merge results into SolanaProject objects
 * 5. Return sorted by stars
 */
async function discoverSolanaProjects(): Promise<ProjectsResponse> {
  console.log(
    `[Projects] Starting discovery for ${TRACKED_USERS.length} tracked users...`
  );

  // Step 1: Fetch all repos from tracked users
  const userRepoMap = new Map<string, GitHubRepo[]>();
  let totalReposScanned = 0;

  const fetchResults = await Promise.allSettled(
    TRACKED_USERS.map(async (user) => {
      try {
        const repos = await fetchUserRepos(user.github);
        userRepoMap.set(user.github, repos);
        totalReposScanned += repos.length;
        console.log(
          `[Projects] Fetched ${repos.length} repos from ${user.github}`
        );
      } catch (error) {
        console.error(
          `[Projects] Failed to fetch repos for ${user.github}:`,
          error
        );
      }
    })
  );

  // Step 2: Deduplicate repos (same repo contributed to by multiple tracked users)
  const repoMap = new Map<
    string,
    { repo: GitHubRepo; contributors: typeof TRACKED_USERS }
  >();

  for (const [username, repos] of userRepoMap.entries()) {
    const user = TRACKED_USERS.find((u) => u.github === username)!;
    for (const repo of repos) {
      const existing = repoMap.get(repo.fullName);
      if (existing) {
        existing.contributors.push(user);
      } else {
        repoMap.set(repo.fullName, {
          repo,
          contributors: [user],
        });
      }
    }
  }

  console.log(
    `[Projects] ${repoMap.size} unique repos found across ${TRACKED_USERS.length} users`
  );

  // Step 3: Run heuristic filter
  const allRepos = Array.from(repoMap.values()).map((r) => r.repo);
  const potentialSolanaRepos = await filterPotentialSolanaRepos(allRepos);

  console.log(
    `[Projects] ${potentialSolanaRepos.length} repos passed heuristic filter`
  );

  // Step 4: Run AI analysis on filtered repos
  const reposForAI = potentialSolanaRepos.map(({ repo, heuristic }) => ({
    repo,
    signals: heuristic.signals,
  }));

  const aiResults = await batchAnalyzeWithAI(reposForAI, 3);

  // Step 5: Build final project list
  const projects: SolanaProject[] = [];

  for (const { repo } of potentialSolanaRepos) {
    const analysis = aiResults.get(repo.fullName);
    if (!analysis || !analysis.isSolanaRelated) continue;

    const contributors = repoMap.get(repo.fullName)?.contributors ?? [];

    // Fetch good first issue count
    const goodFirstIssues = await fetchGoodFirstIssueCount(
      repo.owner.login,
      repo.name
    );

    projects.push({
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      url: repo.url,
      homepage: repo.homepage,
      stars: repo.stars,
      forks: repo.forks,
      language: repo.language,
      topics: repo.topics,
      updatedAt: repo.updatedAt,
      owner: repo.owner,

      category: analysis.category,
      summary: analysis.summary,
      difficulty: analysis.difficulty,
      keyFeatures: analysis.keyFeatures,
      contributionAreas: analysis.contributionAreas,
      confidence: analysis.confidence,

      trackedContributors: contributors,
      goodFirstIssues,
    });
  }

  // Sort by stars descending
  projects.sort((a, b) => b.stars - a.stars);

  console.log(
    `[Projects] Final result: ${projects.length} Solana projects discovered`
  );

  return {
    projects,
    lastUpdated: new Date().toISOString(),
    totalTrackedUsers: TRACKED_USERS.length,
    totalReposScanned,
  };
}

/**
 * Cached entry point for the frontend.
 * Uses Next.js 16 'use cache' with cacheLife('hours').
 */
export async function getSolanaProjects(): Promise<ProjectsResponse> {
  "use cache";

  const { cacheLife } = await import("next/cache");
  cacheLife("hours");

  return discoverSolanaProjects();
}
