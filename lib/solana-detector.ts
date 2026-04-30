/**
 * Fast heuristic-based Solana project detector.
 *
 * This is the first-pass filter that runs BEFORE sending repos
 * to Gemini for deep analysis. It's designed to be fast and cheap.
 */

import {
  SOLANA_KEYWORDS,
  SOLANA_TOPICS,
  SOLANA_FILE_INDICATORS,
} from "./config";
import type { GitHubRepo } from "./types";
import { fetchFileContent } from "./github";

export interface HeuristicResult {
  isPotentiallySolana: boolean;
  confidence: number; // 0-100
  signals: string[];
}

/**
 * Run heuristic analysis on a repository.
 * Returns a confidence score and the signals that triggered it.
 */
export async function analyzeWithHeuristics(
  repo: GitHubRepo
): Promise<HeuristicResult> {
  const signals: string[] = [];
  let score = 0;

  // 1. Check topics (strongest signal — user-curated)
  const matchedTopics = repo.topics.filter((t) =>
    SOLANA_TOPICS.some((st) => t.toLowerCase().includes(st.toLowerCase()))
  );
  if (matchedTopics.length > 0) {
    score += 40;
    signals.push(`Topics: ${matchedTopics.join(", ")}`);
  }

  // 2. Check description for keywords
  const desc = (repo.description ?? "").toLowerCase();
  const nameCheck = repo.name.toLowerCase();
  const matchedKeywords = SOLANA_KEYWORDS.filter(
    (kw) => desc.includes(kw.toLowerCase()) || nameCheck.includes(kw.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    score += 30;
    signals.push(`Keywords in name/desc: ${matchedKeywords.join(", ")}`);
  }

  // 3. Check for Solana-specific files (Anchor.toml, etc.)
  if (score >= 20) {
    // Only do file checks if we already have some signal (saves API calls)
    for (const fileIndicator of SOLANA_FILE_INDICATORS) {
      const content = await fetchFileContent(
        repo.owner.login,
        repo.name,
        fileIndicator,
        repo.defaultBranch
      );
      if (content !== null) {
        score += 30;
        signals.push(`File found: ${fileIndicator}`);
        break; // One file is enough
      }
    }
  }

  // 4. Check if Rust/TypeScript (common Solana languages) — weak signal
  if (repo.language === "Rust" || repo.language === "TypeScript") {
    // Only add if there's already another signal
    if (score > 0) {
      score += 5;
      signals.push(`Language: ${repo.language}`);
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    isPotentiallySolana: score >= 25,
    confidence: score,
    signals,
  };
}

/**
 * Batch-analyze repos with heuristics.
 * Returns only repos that pass the threshold.
 */
export async function filterPotentialSolanaRepos(
  repos: GitHubRepo[],
  minConfidence: number = 25
): Promise<{ repo: GitHubRepo; heuristic: HeuristicResult }[]> {
  const results = await Promise.all(
    repos.map(async (repo) => {
      const heuristic = await analyzeWithHeuristics(repo);
      return { repo, heuristic };
    })
  );

  return results.filter((r) => r.heuristic.confidence >= minConfidence);
}
