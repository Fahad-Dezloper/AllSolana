/**
 * Fast heuristic-based Solana project detector.
 *
 * This is the first-pass filter that runs BEFORE sending repos
 * to Gemini for deep analysis. Designed to be fast and cheap.
 *
 * File checks are only done for repos that already have keyword/topic signals,
 * and are run with concurrency limits.
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

/** Max concurrent file checks to avoid hammering GitHub */
const MAX_FILE_CHECK_CONCURRENCY = 5;

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

  // 2. Check description and name for keywords
  const desc = (repo.description ?? "").toLowerCase();
  const nameCheck = repo.name.toLowerCase();
  const matchedKeywords = SOLANA_KEYWORDS.filter(
    (kw) => desc.includes(kw.toLowerCase()) || nameCheck.includes(kw.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    score += 30;
    signals.push(`Keywords in name/desc: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }

  // 3. Check for Solana-specific files — ONLY if we have some signal already
  if (score >= 30) {
    try {
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
          break;
        }
      }
    } catch {
      // File check failed — no big deal, we already have keyword signals
    }
  }

  // 4. Language bonus (weak signal, only if other signals exist)
  if (score > 0 && (repo.language === "Rust" || repo.language === "TypeScript")) {
    score += 5;
    signals.push(`Language: ${repo.language}`);
  }

  score = Math.min(score, 100);

  return {
    isPotentiallySolana: score >= 25,
    confidence: score,
    signals,
  };
}

/**
 * Batch-analyze repos with heuristics (concurrency-limited).
 * Returns only repos that pass the threshold.
 */
export async function filterPotentialSolanaRepos(
  repos: GitHubRepo[],
  minConfidence: number = 25
): Promise<{ repo: GitHubRepo; heuristic: HeuristicResult }[]> {
  const results: { repo: GitHubRepo; heuristic: HeuristicResult }[] = [];

  // Process in batches to limit concurrent file checks
  for (let i = 0; i < repos.length; i += MAX_FILE_CHECK_CONCURRENCY) {
    const batch = repos.slice(i, i + MAX_FILE_CHECK_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (repo) => {
        try {
          const heuristic = await analyzeWithHeuristics(repo);
          return { repo, heuristic };
        } catch {
          return { repo, heuristic: { isPotentiallySolana: false, confidence: 0, signals: [] } as HeuristicResult };
        }
      })
    );
    results.push(...batchResults);
  }

  return results.filter((r) => r.heuristic.confidence >= minConfidence);
}
