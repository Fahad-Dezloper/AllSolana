/**
 * Configuration for the Solana Open Source Tracker.
 *
 * This file contains the curated list of ecosystem leaders and
 * Superteam members whose GitHub activity we track.
 */

export interface TrackedUser {
  github: string;
  name: string;
  role: string;
}

/**
 * Curated list of Solana ecosystem contributors.
 * Add GitHub handles here to track their open-source contributions.
 */
export const TRACKED_USERS: TrackedUser[] = [
  // Solana Labs / Anza / Core
  { github: "aeyakovenko", name: "Anatoly Yakovenko", role: "Co-founder, Solana" },
  { github: "rajgokal", name: "Raj Gokal", role: "Co-founder, Solana" },
  { github: "jstarry", name: "Justin Starry", role: "Core Engineer, Anza" },
  { github: "buffalu", name: "buffalu", role: "Jito Labs" },
  
  // Ecosystem Builders
  { github: "armaniferrante", name: "Armani Ferrante", role: "Founder, Coral (Anchor)" },
  { github: "ngundotra", name: "Noah Gundotra", role: "Helius Labs" },
  { github: "0xDeep", name: "Deep Patel", role: "Superteam" },
  { github: "SainyTK", name: "Sainy", role: "Superteam" },
  
  // Infrastructure & Tools
  { github: "CanardMandworkin", name: "Canard", role: "Solana Ecosystem" },
  { github: "ironforge-cloud", name: "Ironforge", role: "Solana RPC" },
];

/**
 * Keywords and patterns used by the heuristic Solana detector.
 */
export const SOLANA_KEYWORDS = [
  "solana",
  "anchor",
  "spl-token",
  "spl_token",
  "metaplex",
  "serum",
  "raydium",
  "jupiter",
  "marinade",
  "phantom",
  "backpack",
  "helius",
  "triton",
  "jito",
  "pyth",
  "switchboard",
  "orca",
  "drift",
  "marginfi",
  "tensor",
  "magic-eden",
  "clockwork",
  "squads",
  "realms",
  "bonfida",
  "mango",
  "wormhole",
  "neon-evm",
  "solana-program",
  "solana-sdk",
  "anchor-lang",
  "borsh",
  "sealevel",
  "bankrun",
  "solana-web3",
  "solana-mobile",
  "saga",
  "compressed-nft",
  "bubblegum",
  "geyser",
  "yellowstone",
  "light-protocol",
  "zk-compression",
];

export const SOLANA_FILE_INDICATORS = [
  "Anchor.toml",
  "Xargo.toml",
  "programs/",
];

export const SOLANA_TOPICS = [
  "solana",
  "anchor",
  "solana-program",
  "spl",
  "web3",
  "defi",
  "nft",
  "solana-dapp",
  "solana-blockchain",
  "solana-ecosystem",
];

/**
 * Project categories for classification.
 */
export const PROJECT_CATEGORIES = [
  "DeFi",
  "NFT / Digital Assets",
  "Infrastructure",
  "SDK / Library",
  "Developer Tools",
  "Wallet",
  "Gaming",
  "Governance / DAO",
  "Data / Analytics",
  "Mobile",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
