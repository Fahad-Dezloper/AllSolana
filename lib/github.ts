/**
 * GitHub API client using GraphQL for efficient data fetching.
 *
 * Uses a single GraphQL query to fetch repos, topics, languages,
 * and contribution data — far more efficient than REST.
 */

import type { GitHubRepo } from "./types";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set. Add it to .env.local (see .env.example)"
    );
  }
  return token;
}

/**
 * Execute a GraphQL query against the GitHub API.
 */
async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GraphQL error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `GitHub GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`
    );
  }

  return json.data as T;
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
 * Fetch all public repositories for a GitHub user.
 * Includes topics, languages, and fork/archive status.
 */
export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const query = `
    query($login: String!, $cursor: String) {
      user(login: $login) {
        repositories(
          first: 100
          after: $cursor
          privacy: PUBLIC
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
            repositoryTopics(first: 20) {
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

  const allRepos: GitHubRepo[] = [];
  let cursor: string | null = null;
  let morePages = true;

  while (morePages) {
    const result: UserReposResponse = await graphql<UserReposResponse>(query, { login: username, cursor });

    if (!result.user) {
      console.warn(`GitHub user "${username}" not found, skipping.`);
      break;
    }

    const { repositories } = result.user;

    for (const repo of repositories.nodes) {
      // Skip archived repos and trivial forks
      if (repo.isArchived) continue;

      allRepos.push({
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
        owner: {
          login: repo.owner.login,
          avatarUrl: repo.owner.avatarUrl,
        },
        defaultBranch: repo.defaultBranchRef?.name ?? "main",
      });
    }

    morePages = repositories.pageInfo.hasNextPage;
    cursor = repositories.pageInfo.endCursor;
  }

  return allRepos;
}

/**
 * Fetch "good first issue" count for a repository.
 */
export async function fetchGoodFirstIssueCount(
  owner: string,
  repo: string
): Promise<number> {
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
 * Fetch a file from a repo (e.g., Anchor.toml, Cargo.toml) to check contents.
 * Returns null if the file doesn't exist.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
