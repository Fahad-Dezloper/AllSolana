# Solana Open Source Tracker

A high-performance, AI-driven dashboard to discover and contribute to the best open-source projects in the Solana ecosystem.

## 🚀 Vision
Built for the community, this tool tracks the GitHub activity of Superteam members and Solana ecosystem leaders to surface projects that matter. It automatically identifies Solana-related repos using heuristics and Gemini AI, highlighting where developers can make an impact.

## ✨ Key Features
- **Smart Discovery**: Tracks GitHub activity of 15+ ecosystem leaders.
- **Two-Tier Analysis**: 
  - **Fast Heuristics**: Immediate classification by topics, keywords, and file indicators.
  - **AI Analysis**: Deep contextual understanding using Gemini 2.0 Flash.
- **Persistent Storage**: Powered by PostgreSQL and Prisma for sub-second performance.
- **Background Refresh**: Data stays fresh with non-blocking background synchronization.
- **Good First Issues**: Directly surfaces beginner-friendly tasks.
- **Premium UI**: Modern, glassmorphic design built with Tailwind CSS v4.

## 🛠 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma
- **AI**: Gemini 2.0 Flash via Vercel AI SDK
- **Styling**: Tailwind CSS v4
- **API**: GitHub GraphQL API

## 🏁 Getting Started

### 1. Prerequisites
- Node.js 20+
- A PostgreSQL database
- A GitHub Personal Access Token (PAT)
- A Google Generative AI (Gemini) API Key

### 2. Setup
```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in GITHUB_TOKEN, GOOGLE_GENERATIVE_AI_API_KEY, and DATABASE_URL in .env

# 3. Setup Database
npx prisma db push
```

### 3. Run Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the tracker. The first load will trigger an initial sync to populate your database.

## 📖 Architecture
See [DOCS.md](./DOCS.md) for a deep dive into the discovery pipeline and data classification logic.
