"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Sparkles, Code2, Users, FolderOpen } from "lucide-react";
import type { SolanaProject, ProjectsResponse } from "@/lib/types";
import { PROJECT_CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/config";
import { ProjectCard, ProjectCardSkeleton } from "@/components/ProjectCard";

interface DashboardProps {
  data: ProjectsResponse;
}

export function Dashboard({ data }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  const filteredProjects = useMemo(() => {
    let projects = data.projects;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.owner.login.toLowerCase().includes(q) ||
          p.topics.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      projects = projects.filter((p) => p.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "All") {
      projects = projects.filter((p) => p.difficulty === selectedDifficulty);
    }

    return projects;
  }, [data.projects, search, selectedCategory, selectedDifficulty]);

  // Get unique categories from actual data
  const activeCategories = useMemo(() => {
    const cats = new Set(data.projects.map((p) => p.category));
    return ["All", ...Array.from(cats).sort()];
  }, [data.projects]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <header className="pt-16 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-purple-400" />
            <span className="text-sm text-purple-400 font-medium tracking-wide">
              AI-Powered Discovery
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Solana Open Source
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Contribution Tracker
            </span>
          </h1>
          <p className="text-lg text-[#888] max-w-xl leading-relaxed">
            Discover the best open-source projects in the Solana ecosystem.
            Curated from the GitHub activity of ecosystem leaders and analyzed by AI.
          </p>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-[#888]">
              <FolderOpen size={15} className="text-purple-400/70" />
              <span className="text-white font-semibold">{data.projects.length}</span>
              <span>Projects</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#888]">
              <Users size={15} className="text-emerald-400/70" />
              <span className="text-white font-semibold">{data.totalTrackedUsers}</span>
              <span>Contributors Tracked</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#888]">
              <Code2 size={15} className="text-[#888]" />
              <span className="text-white font-semibold">{data.totalReposScanned.toLocaleString()}</span>
              <span>Repos Scanned</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <section className="px-6 pb-6 sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2"
            />
            <input
              id="search-projects"
              type="text"
              placeholder="Search projects, categories, contributors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <SlidersHorizontal size={14} className="text-muted-2 shrink-0" />
            {activeCategories.map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.replace(/[\s\/]/g, "-").toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
            <div className="w-px h-5 bg-white/10 mx-1" />
            {["All", ...DIFFICULTY_LEVELS].map((diff) => (
              <button
                key={diff}
                id={`difficulty-${diff.toLowerCase()}`}
                onClick={() => setSelectedDifficulty(diff)}
                className={`filter-btn ${selectedDifficulty === diff ? "active" : ""}`}
              >
                {diff === "All" ? "Any Level" : diff}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Project Grid */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {filteredProjects.length > 0 ? (
            <>
              <p className="text-sm text-muted mb-6">
                Showing{" "}
                <span className="text-white font-medium">
                  {filteredProjects.length}
                </span>{" "}
                project{filteredProjects.length !== 1 ? "s" : ""}
                {search && (
                  <>
                    {" "}
                    matching &ldquo;
                    <span className="text-purple-300">{search}</span>&rdquo;
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project, i) => (
                  <ProjectCard
                    key={project.fullName}
                    project={project}
                    index={i}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-lg text-white font-medium mb-1">
                No projects found
              </p>
              <p className="text-sm text-muted">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted-2">
            Last updated:{" "}
            {new Date(data.lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-muted-2">
            Built with{" "}
            <span className="text-purple-400">Gemini AI</span> ×{" "}
            <span className="text-emerald-400">Solana</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
