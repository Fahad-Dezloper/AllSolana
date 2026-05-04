import type { ProjectCategory, DifficultyLevel } from "./config";

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  languages: { name: string; size: number }[];
  topics: string[];
  isArchived: boolean;
  isFork: boolean;
  updatedAt: string;
  pushedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  defaultBranch: string;
}

export interface AIAnalysis {
  isSolanaRelated: boolean;
  confidence: number;
  category: ProjectCategory;
  summary: string;
  difficulty: DifficultyLevel;
  keyFeatures: string[];
}

export interface SolanaProject {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  languages: { name: string; size: number }[];
  topics: string[];
  updatedAt: string;
  pushedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };

  category: ProjectCategory;
  summary: string;
  difficulty: DifficultyLevel;
  keyFeatures: string[];
  confidence: number;

  trackedContributors: {
    github: string;
    name: string;
    role: string;
  }[];
}

export interface ProjectsResponse {
  projects: SolanaProject[];
  lastUpdated: string;
  totalTrackedUsers: number;
  totalReposScanned: number;
  isSyncing?: boolean;
}
