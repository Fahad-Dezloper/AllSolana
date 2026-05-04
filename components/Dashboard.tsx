"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, Filter } from "lucide-react";
import type { SolanaProject, ProjectsResponse } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";

interface DashboardProps {
  data: ProjectsResponse;
}

function Dropdown({ 
  label, 
  options, 
  selected, 
  onToggle 
}: { 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onToggle: (option: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-4 border border-white/10 hover:bg-white/5 text-[11px] uppercase tracking-wider font-bold transition-colors"
      >
        <span className="text-muted-2">{label}:</span>
        <span className="text-white">
          {selected.length === 0 || selected.includes("All") 
            ? "ALL" 
            : selected.length === 1 
            ? selected[0].toUpperCase() 
            : `${selected.length} SELECTED`}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-px w-64 bg-[#0a0a0a] border border-white/10 z-50">
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              onClick={() => {
                onToggle("All");
                setIsOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-white/5 text-left"
            >
              <span>All</span>
              {(selected.length === 0 || selected.includes("All")) && <Check size={12} className="text-accent" />}
            </button>
            <div className="h-px bg-white/5 my-1" />
            {options.filter(o => o !== "All").map((opt) => (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className="flex items-center justify-between w-full px-4 py-2 text-[11px] uppercase tracking-widest hover:bg-white/5 text-left"
              >
                <span className={selected.includes(opt) ? "text-white" : "text-muted"}>{opt}</span>
                {selected.includes(opt) && <Check size={12} className="text-accent" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

    return projects;
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

  return (
    <div className="flex-1 flex flex-col font-sans min-h-screen">
      <header className="sticky top-0 z-30 bg-background border-b border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 bg-accent" />
              <h1 className="text-lg font-bold text-white tracking-tighter uppercase">
                SOLANA <span className="text-muted">CONTRIBUTE</span>
              </h1>
            </div>
            <p className="text-[11px] text-muted-2 uppercase tracking-tight font-medium">
              High-density index of active repositories // sync from {data.totalTrackedUsers} leads
            </p>
          </div>

          <div className="flex items-center gap-8 border-l border-white/10 pl-8 h-10">
            <div className="flex flex-col justify-center">
              <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none mb-1">Index Size</span>
              <span className="text-lg font-bold font-mono text-white leading-none">{data.projects.length}</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none mb-1">Last Sync</span>
              <span className="text-lg font-bold font-mono text-white leading-none">
                {new Date(data.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-8 py-12 pb-32">
        <div className="max-w-7xl mx-auto">
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

      <section className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2"
            />
            <input
              id="search-projects"
              type="text"
              placeholder="SEARCH REPOSITORIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input !pl-12 !h-10 !text-[12px] !font-bold !tracking-wider uppercase !bg-white/5"
            />
          </div>

          <div className="flex items-center gap-px">
            <Dropdown 
              label="CATEGORY" 
              options={allCategories} 
              selected={selectedCategories} 
              onToggle={toggleCategory} 
            />
            <Dropdown 
              label="LANGUAGE" 
              options={allLanguages} 
              selected={selectedLanguages} 
              onToggle={toggleLanguage} 
            />
            
            {(selectedCategories[0] !== "All" || selectedLanguages[0] !== "All" || search) && (
              <button 
                onClick={() => {
                  setSearch("");
                  setSelectedCategories(["All"]);
                  setSelectedLanguages(["All"]);
                }}
                className="h-10 px-4 border border-white/10 hover:bg-white/5 text-muted-2 hover:text-white"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="px-8 py-6 border-t border-white/10 text-[9px] text-muted-2 font-mono uppercase tracking-[0.3em] mb-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p>SYSTEM STATUS: READY // REPOS: {data.totalReposScanned}</p>
          <span>GEMINI ANALYSIS ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
