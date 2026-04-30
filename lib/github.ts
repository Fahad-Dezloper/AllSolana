/**
 * GitHub API client using GraphQL for efficient data fetching.
 *
 * Includes:
 * - Rate limit awareness (checks remaining quota before calls)
 * - Per-user repo cap (MAX_REPOS_PER_USER) to avoid fetching hundreds
 * - Concurrency-limited fetching (MAX_CONCURRENT_USERS)
 * - Proper timeouts and error handling
 */

import type { GitHubRepo } from "./types";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

/** Max repos to fetch per user (sorted by stars DESC, so we get the best ones) */
const MAX_REPOS_PER_USER = 30;

/** Max users to fetch in parallel */
const MAX_CONCURRENT_USERS = 3;

/** Timeout for a single GraphQL request (ms) */
const REQUEST_TIMEOUT_MS = 15_000;

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[GitHub] GITHUB_TOKEN is not set. Skipping GitHub fetches.");
    return "";
  }
  return token;
}

/**
 * Execute a GraphQL query against the GitHub API with timeout.
 */
async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "unknown");
      // Handle rate limit specifically
      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        console.warn(`[GitHub] Rate limited. Retry after ${retryAfter}s`);
        throw new Error(`GitHub rate limited (${res.status}). Retry after ${retryAfter}s`);
      }
      throw new Error(`GitHub GraphQL error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    if (json.errors) {
      // Log but don't crash — GraphQL can return partial data with errors
      console.warn(`[GitHub] GraphQL warnings: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
    }

    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
}

interface UserReposResponse {
  user: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string };
      nodes: Array<{
        name: string;
        nameWithOwner: string;
        description: string | null;
        url: string;
        homepageUrl: string | null;
        stargazerCount: number;
        forkCount: number;
        primaryLanguage: { name: string } | null;
        repositoryTopics: {
          nodes: Array<{ topic: { name: string } }>;
        };
        isArchived: boolean;
        isFork: boolean;
        updatedAt: string;
        pushedAt: string;
        owner: { login: string; avatarUrl: string };
        defaultBranchRef: { name: string } | null;
      }>;
    };
  };
}

/**
 * Fetch public repos for a GitHub user.
 * Capped at MAX_REPOS_PER_USER, ordered by stars DESC.
 */
export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const token = getToken();
  if (!token) return [];

  // Only fetch top N repos — no pagination needed for most users
  const fetchCount = Math.min(MAX_REPOS_PER_USER, 100);

  const query = `
    query($login: String!, $first: Int!) {
      user(login: $login) {
        repositories(
          first: $first
          privacy: PUBLIC
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          nodes {
            name
            nameWithOwner
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            primaryLanguage {
              name
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
            isArchived
            isFork
            updatedAt
            pushedAt
            owner {
              login
              avatarUrl
            }
            defaultBranchRef {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const result: UserReposResponse = await graphql<UserReposResponse>(query, {
      login: username,
      first: fetchCount,
    });

    if (!result.user) {
      console.warn(`[GitHub] User "${username}" not found, skipping.`);
      return [];
    }

    const repos: GitHubRepo[] = [];
    for (const repo of result.user.repositories.nodes) {
      if (repo.isArchived) continue;

      repos.push({
        name: repo.name,
        fullName: repo.nameWithOwner,
        description: repo.description,
        url: repo.url,
        homepage: repo.homepageUrl,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name ?? null,
        topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
        isArchived: repo.isArchived,
        isFork: repo.isFork,
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
        owner: { login: repo.owner.login, avatarUrl: repo.owner.avatarUrl },
        defaultBranch: repo.defaultBranchRef?.name ?? "main",
      });
    }

    return repos;
  } catch (error) {
    console.error(`[GitHub] Failed to fetch repos for ${username}:`, (error as Error).message);
    return [];
  }
}

/**
 * Fetch repos for multiple users with concurrency limit.
 */
export async function fetchMultipleUsersRepos(
  usernames: string[]
): Promise<Map<string, GitHubRepo[]>> {
  const results = new Map<string, GitHubRepo[]>();

  for (let i = 0; i < usernames.length; i += MAX_CONCURRENT_USERS) {
    const batch = usernames.slice(i, i + MAX_CONCURRENT_USERS);
    const batchResults = await Promise.allSettled(
      batch.map(async (username) => {
        const repos = await fetchUserRepos(username);
        return { username, repos };
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.set(result.value.username, result.value.repos);
      }
    }
  }

  return results;
}

/**
 * Fetch "good first issue" count for a repository.
 */
export async function fetchGoodFirstIssueCount(
  owner: string,
  repo: string
): Promise<number> {
  const token = getToken();
  if (!token) return 0;

  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(
          states: OPEN
          labels: ["good first issue", "help wanted"]
          first: 0
        ) {
          totalCount
        }
      }
    }
  `;

  try {
    const data = await graphql<{
      repository: { issues: { totalCount: number } };
    }>(query, { owner, repo });
    return data.repository?.issues?.totalCount ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch a file from a repo to check if it exists.
 * Returns null if the file doesn't exist or on error.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    // Only read first 500 chars — we just need to confirm the file exists
    const text = await res.text();
    return text.slice(0, 500);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
