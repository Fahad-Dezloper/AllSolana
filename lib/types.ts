/**
 * Shared type definitions for the Solana Open Source Tracker.
 */

import type { ProjectCategory, DifficultyLevel } from "./config";

/**
 * Raw repository data from GitHub API.
 */
export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
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

/**
 * AI analysis result from Gemini.
 */
export interface AIAnalysis {
  isSolanaRelated: boolean;
  confidence: number; // 0-100
  category: ProjectCategory;
  summary: string;
  difficulty: DifficultyLevel;
  keyFeatures: string[];
  contributionAreas: string[];
}

/**
 * A fully processed Solana project ready for display.
 */
export interface SolanaProject {
  // From GitHub
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };

  // From AI Analysis
  category: ProjectCategory;
  summary: string;
  difficulty: DifficultyLevel;
  keyFeatures: string[];
  contributionAreas: string[];
  confidence: number;

  // Tracked contributors who work on this
  trackedContributors: {
    github: string;
    name: string;
    role: string;
  }[];

  // Good first issues count (optional)
  goodFirstIssues?: number;
}

/**
 * Response from the projects API.
 */
export interface ProjectsResponse {
  projects: SolanaProject[];
  lastUpdated: string;
  totalTrackedUsers: number;
  totalReposScanned: number;
}
