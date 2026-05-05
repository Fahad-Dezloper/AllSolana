import type { GitHubRepo } from "./types";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const MAX_REPOS_PER_USER = 30;
const MAX_CONCURRENT_USERS = 3;
const REQUEST_TIMEOUT_MS = 15_000;

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[GitHub] GITHUB_TOKEN is not set. Skipping GitHub fetches.");
    return "";
  }
  return token;
}

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
      if (res.status === 403 || res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") ?? "60";
        console.warn(`[GitHub] Rate limited. Retry after ${retryAfter}s`);
        throw new Error(`GitHub rate limited (${res.status}). Retry after ${retryAfter}s`);
      }
      throw new Error(`GitHub GraphQL error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    if (json.errors) {
      console.warn(`[GitHub] GraphQL warnings: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
    }

    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
}

interface RepoOwnerResponse {
  repositoryOwner: {
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
        languages: {
          edges: Array<{ size: number; node: { name: string } }>;
        };
        issues?: { totalCount: number } | null;
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

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const token = getToken();
  if (!token) return [];

  const fetchCount = Math.min(MAX_REPOS_PER_USER, 100);

  const query = `
    query($login: String!, $first: Int!) {
      repositoryOwner(login: $login) {
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
            languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                }
              }
            }
            issues(states: OPEN) {
              totalCount
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
    const result: RepoOwnerResponse = await graphql<RepoOwnerResponse>(query, {
      login: username,
      first: fetchCount,
    });

    if (!result.repositoryOwner) {
      console.warn(`[GitHub] Repository owner "${username}" not found, skipping.`);
      return [];
    }

    const repos: GitHubRepo[] = [];
    for (const repo of result.repositoryOwner.repositories.nodes) {
      if (repo.isArchived) continue;

      repos.push({
        name: repo.name,
        fullName: repo.nameWithOwner,
        description: repo.description,
        url: repo.url,
        homepage: repo.homepageUrl,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        openIssues: repo.issues?.totalCount ?? 0,
        languages: repo.languages.edges.map((e) => ({
          name: e.node.name,
          size: e.size,
        })),
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

export async function fetchLiveRepoData(fullNames: string[]): Promise<Map<string, GitHubRepo>> {
  const result = new Map<string, GitHubRepo>();
  if (fullNames.length === 0) return result;

  const chunkSize = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < fullNames.length; i += chunkSize) {
    chunks.push(fullNames.slice(i, i + chunkSize));
  }

  const results = await Promise.all(chunks.map(async (chunk) => {
    const chunkMap = new Map<string, GitHubRepo>();
    const query = `
      query {
        ${chunk.map((name, idx) => {
          const [owner, repo] = name.split("/");
          return `repo_${idx}: repository(owner: "${owner}", name: "${repo}") {
            name
            nameWithOwner
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node {
                  name
                }
              }
            }
            issues(states: OPEN) {
              totalCount
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
          }`;
        }).join("\n")}
      }
    `;

    try {
      const data = await graphql<Record<string, any>>(query);
      chunk.forEach((name, idx) => {
        const repo = data[`repo_${idx}`];
        if (repo) {
          chunkMap.set(name, {
            name: repo.name,
            fullName: repo.nameWithOwner,
            description: repo.description,
            url: repo.url,
            homepage: repo.homepageUrl,
            stars: repo.stargazerCount,
            forks: repo.forkCount,
            openIssues: repo.issues?.totalCount ?? 0,
            languages: repo.languages.edges.map((e: any) => ({
              name: e.node.name,
              size: e.size,
            })),
            topics: repo.repositoryTopics.nodes.map((t: any) => t.topic.name),
            isArchived: repo.isArchived,
            isFork: repo.isFork,
            updatedAt: repo.updatedAt,
            pushedAt: repo.pushedAt,
            owner: { login: repo.owner.login, avatarUrl: repo.owner.avatarUrl },
            defaultBranch: repo.defaultBranchRef?.name ?? "main",
          });
        }
      });
    } catch (err) {
      console.error(`[GitHub] Chunk fetch failed:`, (err as Error).message);
    }
    return chunkMap;
  }));

  results.forEach(map => {
    map.forEach((val, key) => result.set(key, val));
  });

  return result;
}

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
    const text = await res.text();
    return text.slice(0, 500);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
