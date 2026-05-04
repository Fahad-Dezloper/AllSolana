import {
  SOLANA_KEYWORDS,
  SOLANA_TOPICS,
  SOLANA_FILE_INDICATORS,
} from "./config";
import type { GitHubRepo } from "./types";
import { fetchFileContent } from "./github";

export interface HeuristicResult {
  isPotentiallySolana: boolean;
  confidence: number;
  signals: string[];
}

const MAX_FILE_CHECK_CONCURRENCY = 5;

export async function analyzeWithHeuristics(
  repo: GitHubRepo
): Promise<HeuristicResult> {
  const signals: string[] = [];
  let score = 0;

  const matchedTopics = repo.topics.filter((t) =>
    SOLANA_TOPICS.some((st) => t.toLowerCase().includes(st.toLowerCase()))
  );
  if (matchedTopics.length > 0) {
    score += 40;
    signals.push(`Topics: ${matchedTopics.join(", ")}`);
  }

  const desc = (repo.description ?? "").toLowerCase();
  const nameCheck = repo.name.toLowerCase();
  const matchedKeywords = SOLANA_KEYWORDS.filter(
    (kw) => desc.includes(kw.toLowerCase()) || nameCheck.includes(kw.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    score += 30;
    signals.push(`Keywords in name/desc: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }

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
    }
  }

  const hasRust = repo.languages.some(l => l.name === "Rust");
  const hasTS = repo.languages.some(l => l.name === "TypeScript");

  if (score > 0 && (hasRust || hasTS)) {
    score += 5;
    signals.push(`Language: ${hasRust ? "Rust" : "TypeScript"}`);
  }

  score = Math.min(score, 100);

  return {
    isPotentiallySolana: score >= 25,
    confidence: score,
    signals,
  };
}

export async function filterPotentialSolanaRepos(
  repos: GitHubRepo[],
  minConfidence: number = 25
): Promise<{ repo: GitHubRepo; heuristic: HeuristicResult }[]> {
  const results: { repo: GitHubRepo; heuristic: HeuristicResult }[] = [];

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
