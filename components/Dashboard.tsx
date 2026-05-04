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
        className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white/20 bg-transparent text-[12px] uppercase tracking-wider font-bold transition-colors"
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
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#0a0a0a] border border-white/10 z-50 shadow-2xl">
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
    <div className="flex-1 flex flex-col font-sans">
      {/* Header */}
      <header className="pt-20 pb-12 px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent">Terminal v1.0.4</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
                SOLANA<br />
                <span className="text-muted">CONTRIBUTE</span>
              </h1>
              <p className="text-[14px] text-muted-2 max-w-lg leading-relaxed uppercase tracking-tight">
                High-density index of active Solana repositories. 
                Data synchronized from {data.totalTrackedUsers} ecosystem leads.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-l border-white/10 pl-8">
              <div>
                <span className="block text-[10px] text-muted-2 uppercase font-bold mb-1">Index Size</span>
                <span className="text-2xl font-bold font-mono text-white">{data.projects.length}</span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-2 uppercase font-bold mb-1">Last Sync</span>
                <span className="text-2xl font-bold font-mono text-white">
                  {new Date(data.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <section className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/5 px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2"
            />
            <input
              id="search-projects"
              type="text"
              placeholder="SEARCH BY PROJECT, OWNER, OR CATEGORY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input !pl-12 !py-3 !text-[13px] !font-bold !tracking-wider uppercase"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto">
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
                className="p-2 border border-white/10 hover:bg-white/5 text-muted-2 hover:text-white"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/5 border border-white/5">
              {filteredProjects.map((project, i) => (
                <div key={project.fullName} className="bg-background">
                  <ProjectCard
                    project={project}
                    index={i}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10">
              <Filter size={32} className="text-muted-2 mb-4" />
              <p className="text-sm text-white font-bold uppercase tracking-widest mb-1">No matches found</p>
              <p className="text-xs text-muted-2 uppercase tracking-widest">Try relaxing your filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/5 text-[10px] text-muted-2 font-mono uppercase tracking-[0.2em]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p>SOLANA CONTRIBUTION TRACKER // SYSTEM READY</p>
          <div className="flex items-center gap-6">
            <span>{data.totalReposScanned} REPOS SCANNED</span>
            <span>GEMINI ANALYSIS ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
