/**
 * AI Analysis Layer using Gemini 2.0 Flash via Vercel AI SDK.
 *
 * This is the second-tier classification engine. Repos that pass
 * the heuristic filter are sent here for deep, contextual analysis.
 */

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { PROJECT_CATEGORIES, DIFFICULTY_LEVELS } from "./config";
import type { GitHubRepo, AIAnalysis } from "./types";

const analysisSchema = z.object({
  isSolanaRelated: z
    .boolean()
    .describe("Whether this repository is related to the Solana blockchain ecosystem"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence score from 0-100 on how sure you are"),
  category: z
    .enum(PROJECT_CATEGORIES)
    .describe("The primary category this project belongs to"),
  summary: z
    .string()
    .max(200)
    .describe("A concise, punchy 1-2 sentence description for developers looking to contribute"),
  difficulty: z
    .enum(DIFFICULTY_LEVELS)
    .describe("How difficult it would be for a new contributor to start working on this project"),
  keyFeatures: z
    .array(z.string())
    .max(5)
    .describe("Top 3-5 key features or technical highlights of this project"),
  contributionAreas: z
    .array(z.string())
    .max(5)
    .describe("Areas where contributors could make an impact (e.g., 'Documentation', 'Testing', 'Feature Development')"),
});

/**
 * Build the analysis prompt for Gemini.
 */
function buildPrompt(repo: GitHubRepo, heuristicSignals: string[]): string {
  return `You are a Solana blockchain ecosystem expert. Analyze this GitHub repository and determine if it's related to the Solana ecosystem.

## Repository Details
- **Name**: ${repo.fullName}
- **Description**: ${repo.description ?? "No description"}
- **Language**: ${repo.language ?? "Unknown"}
- **Topics**: ${repo.topics.length > 0 ? repo.topics.join(", ") : "None"}
- **Stars**: ${repo.stars} | **Forks**: ${repo.forks}
- **Last Updated**: ${repo.updatedAt}
- **URL**: ${repo.url}

## Heuristic Signals (pre-analysis)
${heuristicSignals.map((s) => `- ${s}`).join("\n")}

## Instructions
1. Use web search to verify if this project is part of the Solana ecosystem.
2. Look at the repo name, description, topics, and any context you can find.
3. Be thorough — some Solana projects don't mention "Solana" directly (e.g., Anchor, Metaplex, Jito, Helius tools).
4. Classify the project into the right category.
5. Write a punchy, developer-friendly summary (not generic — make it specific to what this project does).
6. Estimate contribution difficulty based on the language, project size, and complexity.
7. Suggest specific areas where new contributors could help.

Only mark as Solana-related if you're genuinely confident. We want quality over quantity.`;
}

/**
 * Analyze a repository using Gemini AI.
 */
export async function analyzeWithAI(
  repo: GitHubRepo,
  heuristicSignals: string[]
): Promise<AIAnalysis> {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: analysisSchema,
      prompt: buildPrompt(repo, heuristicSignals),
    });

    return object;
  } catch (error) {
    console.error(`AI analysis failed for ${repo.fullName}:`, error);

    // Fallback: use heuristic data if AI fails
    return {
      isSolanaRelated: true, // It passed heuristics, so likely true
      confidence: 50,
      category: "Other",
      summary: repo.description ?? "A Solana ecosystem project.",
      difficulty: "Intermediate",
      keyFeatures: [],
      contributionAreas: ["Documentation", "Testing"],
    };
  }
}

/**
 * Batch analyze multiple repos with AI (with concurrency limit).
 */
export async function batchAnalyzeWithAI(
  repos: { repo: GitHubRepo; signals: string[] }[],
  concurrency: number = 3
): Promise<Map<string, AIAnalysis>> {
  const results = new Map<string, AIAnalysis>();

  // Process in chunks to avoid rate limits
  for (let i = 0; i < repos.length; i += concurrency) {
    const chunk = repos.slice(i, i + concurrency);
    const analyses = await Promise.all(
      chunk.map(({ repo, signals }) => analyzeWithAI(repo, signals))
    );
    chunk.forEach(({ repo }, idx) => {
      results.set(repo.fullName, analyses[idx]);
    });
  }

  return results;
}
