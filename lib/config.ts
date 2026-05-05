export interface TrackedUser {
  github: string;
  name: string;
  role: string;
}

export const TRACKED_USERS: TrackedUser[] = [
  { github: "aeyakovenko", name: "Anatoly Yakovenko", role: "Co-founder, Solana" },
  { github: "rajgokal", name: "Raj Gokal", role: "Co-founder, Solana" },
  { github: "jstarry", name: "Justin Starry", role: "Core Engineer, Anza" },
  { github: "buffalu", name: "buffalu", role: "Jito Labs" },
  { github: "skanev", name: "Stefan Kanev", role: "Solana Core" },
  { github: "jacobcreech", name: "Jacob Creech", role: "Solana Foundation" },
  
  { github: "armaniferrante", name: "Armani Ferrante", role: "Coral / Backpack" },
  { github: "ngundotra", name: "Noah Gundotra", role: "Helius Labs" },
  { github: "mertaydogan", name: "Mert Mumtaz", role: "Helius" },
  { github: "0xDeep", name: "Deep Patel", role: "Superteam" },
  { github: "SainyTK", name: "Sainy", role: "Superteam" },
  { github: "buffalojoel", name: "Joel", role: "Superteam" },
  
  { github: "CanardMandworkin", name: "Canard", role: "Solana Ecosystem" },
  { github: "ironforge-cloud", name: "Ironforge", role: "Solana RPC" },
  { github: "laine-sa", name: "Laine", role: "Validator / Tooling" },
  { github: "jito-foundation", name: "Jito Foundation", role: "Infrastructure" },
];

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
] as const;

export type ProjectCategory = string;

export const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
 ] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
