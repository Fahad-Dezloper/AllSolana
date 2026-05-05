"use client";

import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import type { SolanaProject, ProjectsResponse } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";
import { TopBar } from "@/components/TopBar";
import { BottomBar } from "@/components/BottomBar";

interface DashboardProps {
  data: ProjectsResponse;
}

export function Dashboard({ data }: DashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["All"]);

  const allCategories = useMemo(() => {
    const cats = new Set(data.projects.map((p) => p.category));
    return Array.from(cats).sort();
  }, [data.projects]);

  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    data.projects.forEach(p => {
      p.languages.forEach(l => langs.add(l.name));
    });
    return Array.from(langs).sort();
  }, [data.projects]);

  const filteredProjects = useMemo(() => {
    let projects = data.projects;

    if (search.trim()) {
      const q = search.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.owner.login.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0 && !selectedCategories.includes("All")) {
      projects = projects.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedLanguages.length > 0 && !selectedLanguages.includes("All")) {
      projects = projects.filter((p) => 
        p.languages.some(lang => selectedLanguages.includes(lang.name))
      );
    }

    return [...projects].sort((a, b) => 
      new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
    );
  }, [data.projects, search, selectedCategories, selectedLanguages]);

  const toggleCategory = (cat: string) => {
    if (cat === "All") {
      setSelectedCategories(["All"]);
      return;
    }
    setSelectedCategories((prev) => {
      const filtered = prev.filter((p) => p !== "All");
      if (filtered.includes(cat)) {
        const next = filtered.filter((p) => p !== cat);
        return next.length === 0 ? ["All"] : next;
      }
      return [...filtered, cat];
    });
  };

  const toggleLanguage = (lang: string) => {
    if (lang === "All") {
      setSelectedLanguages(["All"]);
      return;
    }
    setSelectedLanguages((prev) => {
      const filtered = prev.filter((p) => p !== "All");
      if (filtered.includes(lang)) {
        const next = filtered.filter((p) => p !== lang);
        return next.length === 0 ? ["All"] : next;
      }
      return [...filtered, lang];
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories(["All"]);
    setSelectedLanguages(["All"]);
  };

  return (
    <div className="flex-1 flex flex-col font-sans min-h-screen">
      <TopBar projectsCount={data.projects.length} />

      <main className="flex-1 px-8 py-12 pb-32">
        <div className="max-w-8xl mx-auto">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={project.fullName}
                  project={project}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 border border-white/10">
              <Filter size={32} className="text-muted-2 mb-4" />
              <p className="text-sm text-white font-bold uppercase tracking-widest mb-1">No matches found</p>
              <p className="text-xs text-muted-2 uppercase tracking-widest">Try relaxing your filters</p>
            </div>
          )}
        </div>
      </main>

      <BottomBar 
        search={search}
        setSearch={setSearch}
        allCategories={allCategories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        allLanguages={allLanguages}
        selectedLanguages={selectedLanguages}
        toggleLanguage={toggleLanguage}
        clearFilters={clearFilters}
      />

      <footer className="px-8 py-6 border-t border-white/10 text-[9px] text-muted-2 font-mono uppercase tracking-[0.3em] mb-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p>SYSTEM STATUS: READY // REPOS: {data.totalReposScanned}</p>
          <span>GEMINI ANALYSIS ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
