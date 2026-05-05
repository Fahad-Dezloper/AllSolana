"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface DropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}

function Dropdown({ label, options, selected, onToggle }: DropdownProps) {
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
        className="flex items-center gap-2 h-9 px-4 border border-white/10 hover:bg-white/5 text-[11px] uppercase tracking-wider font-bold transition-colors"
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
            {options.filter((o) => o !== "All").map((opt) => (
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

interface BottomBarProps {
  search: string;
  setSearch: (val: string) => void;
  allCategories: string[] ;
  selectedCategories: string[];
  toggleCategory: (cat: string) => void;
  allLanguages: string[];
  selectedLanguages: string[];
  toggleLanguage: (lang: string) => void;
  clearFilters: () => void;
}

export function BottomBar({
  search,
  setSearch,
  allCategories,
  selectedCategories,
  toggleCategory,
  allLanguages,
  selectedLanguages,
  toggleLanguage,
  clearFilters,
}: BottomBarProps) {
  const hasActiveFilters = 
    (selectedCategories.length > 0 && selectedCategories[0] !== "All") || 
    (selectedLanguages.length > 0 && selectedLanguages[0] !== "All") || 
    search !== "";

  return (
    <section className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/20 px-8 py-3 shadow-[0_-10px_50px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-2" />
          <input
            id="search-projects"
            type="text"
            placeholder="SEARCH REPOSITORIES..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input !pl-11 !h-9 !text-[11px] !font-bold !tracking-wider uppercase !bg-white/5"
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

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-4 border border-white/10 hover:bg-white/5 text-muted-2 hover:text-white transition-colors"
              title="Clear Filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
