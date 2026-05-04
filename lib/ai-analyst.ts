import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { PROJECT_CATEGORIES, DIFFICULTY_LEVELS } from "./config";
import type { GitHubRepo, AIAnalysis } from "./types";

const MAX_AI_ANALYSES_PER_RUN = 15;
const DELAY_BETWEEN_REQUESTS_MS = 2_500;

let aiDisabled = false;

const analysisSchema = z.object({
  isSolanaRelated: z.boolean(),
  confidence: z.number().min(0).max(100),
  category: z.enum(PROJECT_CATEGORIES),
  summary: z.string().max(200),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  keyFeatures: z.array(z.string()).max(5),
});

function buildPrompt(repo: GitHubRepo, heuristicSignals: string[]): string {
  const languagesStr = repo.languages.map(l => l.name).join(", ");
  
  return `You are a Solana blockchain ecosystem expert. Analyze this GitHub repository and determine if it's related to the Solana ecosystem.
  
## Repository Details
- **Name**: ${repo.fullName}
- **Description**: ${repo.description ?? "No description"}
- **Languages**: ${languagesStr || "Unknown"}
- **Topics**: ${repo.topics.length > 0 ? repo.topics.join(", ") : "None"}
- **URL**: ${repo.url}

## Heuristic Signals (pre-analysis)
${heuristicSignals.map((s) => `- ${s}`).join("\n")}

## Instructions
1. Look at the repo name, description, topics, and any context you can find.
2. Be thorough — some Solana projects don't mention "Solana" directly (e.g., Anchor, Metaplex, Jito, Helius tools).
3. Classify the project STRICTLY into one of these categories:
   - **DeFi**: Decentralized exchange, lending, borrowing, yield, stablecoins, derivatives.
   - **NFT / Digital Assets**: NFT marketplaces, standards (Metaplex), collections, minting tools.
   - **Infrastructure**: Validators, RPC nodes, Geyser plugins, indexing, core protocol tools.
   - **SDK / Library**: Code libraries for interacting with Solana (e.g., anchor-lang, solana-web3.js, solana-go).
   - **Developer Tools**: CLI tools, local development environments, debuggers, testing frameworks (bankrun).
   - **Wallet**: Wallet software, adapters, or key management.
   - **Gaming**: Game engines on Solana, on-chain games, gaming SDKs.
   - **Governance / DAO**: Voting systems, multisigs (Squads), governance frameworks (Realms).
   - **Data / Analytics**: Block explorers, on-chain data dashboards, analytics tools.
   - **Mobile**: Solana Mobile Stack, SMS-related tools, mobile apps.
   - **Other**: Anything that doesn't fit the above but IS Solana-related.

4. Write a punchy, developer-friendly summary (not generic — make it specific to what this project does).
5. Estimate contribution difficulty based on the language, project size, and complexity.

Only mark as Solana-related if you're genuinely confident. We want quality over quantity.`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildFallbackAnalysis(
  repo: GitHubRepo,
  heuristicSignals: string[]
): AIAnalysis {
  const text = `${repo.name} ${repo.description ?? ""} ${repo.topics.join(" ")}`.toLowerCase();
  let category: AIAnalysis["category"] = "Other";
  if (text.includes("defi") || text.includes("swap") || text.includes("amm") || text.includes("lending")) category = "DeFi";
  else if (text.includes("nft") || text.includes("metaplex") || text.includes("token")) category = "NFT / Digital Assets";
  else if (text.includes("sdk") || text.includes("lib") || text.includes("client")) category = "SDK / Library";
  else if (text.includes("tool") || text.includes("cli") || text.includes("devtool")) category = "Developer Tools";
  else if (text.includes("wallet") || text.includes("phantom") || text.includes("backpack")) category = "Wallet";
  else if (text.includes("validator") || text.includes("rpc") || text.includes("infra")) category = "Infrastructure";
  else if (text.includes("dao") || text.includes("governance") || text.includes("vote")) category = "Governance / DAO";

  let difficulty: AIAnalysis["difficulty"] = "Intermediate";
  const primaryLang = repo.languages[0]?.name;
  if (primaryLang === "Rust") difficulty = "Advanced";
  else if (primaryLang === "TypeScript" || primaryLang === "JavaScript") difficulty = "Beginner";

  return {
    isSolanaRelated: true,
    confidence: 60,
    category,
    summary: repo.description ?? `A Solana ecosystem project (${heuristicSignals[0] ?? "detected by heuristics"}).`,
    difficulty,
    keyFeatures: repo.topics.slice(0, 3),
  };
}

export async function analyzeWithAI(
  repo: GitHubRepo,
  heuristicSignals: string[]
): Promise<AIAnalysis> {
  if (aiDisabled) {
    return buildFallbackAnalysis(repo, heuristicSignals);
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    aiDisabled = true;
    console.warn("[AI] No API key configured. Using heuristic fallbacks for all repos.");
    return buildFallbackAnalysis(repo, heuristicSignals);
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: analysisSchema,
      prompt: buildPrompt(repo, heuristicSignals),
      maxRetries: 0,
    });

    console.log(`[AI] ✓ ${repo.fullName} → ${object.category} (${object.confidence}%)`);
    return object;
  } catch (error) {
    const errMsg = String((error as Error).message ?? "");

    if (
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("quota") ||
      errMsg.includes("rate") ||
      (error as { statusCode?: number }).statusCode === 429
    ) {
      console.warn(`[AI] ⚠ Rate limited on ${repo.fullName}. Disabling AI for remaining repos.`);
      aiDisabled = true;
      return buildFallbackAnalysis(repo, heuristicSignals);
    }

    console.error(`[AI] ✗ ${repo.fullName}: ${errMsg.slice(0, 150)}`);
    return buildFallbackAnalysis(repo, heuristicSignals);
  }
}

export async function batchAnalyzeWithAI(
  repos: { repo: GitHubRepo; signals: string[] }[]
): Promise<Map<string, AIAnalysis>> {
  const results = new Map<string, AIAnalysis>();

  const toAnalyze = repos.slice(0, MAX_AI_ANALYSES_PER_RUN);
  const skipped = repos.length - toAnalyze.length;

  if (skipped > 0) {
    console.log(`[AI] Budget: ${toAnalyze.length} AI + ${skipped} fallback`);
  }

  for (let i = 0; i < toAnalyze.length; i++) {
    const { repo, signals } = toAnalyze[i];
    const analysis = await analyzeWithAI(repo, signals);
    results.set(repo.fullName, analysis);

    if (i < toAnalyze.length - 1 && !aiDisabled) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  for (let i = toAnalyze.length; i < repos.length; i++) {
    const { repo, signals } = repos[i];
    results.set(repo.fullName, buildFallbackAnalysis(repo, signals));
  }

  return results;
}
