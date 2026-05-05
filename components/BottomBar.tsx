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
  const [displaySelected, setDisplaySelected] = useState(selected);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update display label only when dropdown closes to prevent layout shift while selecting
  useEffect(() => {
    if (!isOpen) {
      setDisplaySelected(selected);
    }
  }, [isOpen, selected]);

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
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white"
      >
        <span className="text-neutral-500">{label}:</span>
        <span className="transition-all duration-300">
          {displaySelected.length === 0 || displaySelected.includes("All")
            ? "ALL"
            : displaySelected.length === 1
            ? displaySelected[0].toUpperCase()
            : `${displaySelected.length} SELECTED`}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-64 rounded-2xl border border-neutral-700 bg-[#161616] shadow-[0_20px_50px_rgba(0,0,0,1)] z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-2 px-2">
            <button
              onClick={() => {
                onToggle("All");
                setIsOpen(false);
              }}
              className="group flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all hover:bg-neutral-800 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  (selected.length === 0 || selected.includes("All")) 
                    ? "bg-accent border-accent" 
                    : "border-neutral-700 group-hover:border-neutral-500"
                }`}>
                  {(selected.length === 0 || selected.includes("All")) && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className={(selected.length === 0 || selected.includes("All")) ? "text-white" : "text-neutral-400 group-hover:text-neutral-300"}>All</span>
              </div>
            </button>
            <div className="h-px bg-neutral-800 my-1 mx-2" />
            {options.filter((o) => o !== "All").map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className="group flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all hover:bg-neutral-800 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected 
                        ? "bg-accent border-accent" 
                        : "border-neutral-700 group-hover:border-neutral-500"
                    }`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={isSelected ? "text-white" : "text-neutral-400 group-hover:text-neutral-300"}>{opt}</span>
                  </div>
                </button>
              );
            })}
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
  sortBy: string;
  setSortBy: (val: string) => void;
  clearFilters: () => void;
}

function SortDropdown({ current, onSelect }: { current: string, onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: "RECENT", value: "RECENT" },
    { label: "STARS", value: "STARS" },
    { label: "ISSUES", value: "ISSUES" },
    { label: "PR", value: "PR" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = options.find(o => o.value === current)?.label || "RECENT";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white"
      >
        <span className="text-neutral-500">SORT:</span>
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-48 rounded-2xl border border-neutral-700 bg-[#161616] shadow-[0_20px_50px_rgba(0,0,0,1)] z-50 overflow-hidden">
          <div className="py-2 px-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all hover:bg-neutral-800 text-left ${
                  current === opt.value ? "text-white bg-neutral-800" : "text-neutral-400 group-hover:text-neutral-300"
                }`}
              >
                {opt.label}
                {current === opt.value && <Check size={10} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  sortBy,
  setSortBy,
  clearFilters,
}: BottomBarProps) {
  const hasActiveFilters = 
    (selectedCategories.length > 0 && selectedCategories[0] !== "All") || 
    (selectedLanguages.length > 0 && selectedLanguages[0] !== "All") || 
    search !== "";

  return (
    <section className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center">
      <div className="flex items-center gap-1.5 rounded-full border border-neutral-700/50 bg-neutral-900/90 px-2 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:gap-2 sm:px-3">
        
        {/* Search Section */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-neutral-500" />
          <input
            id="search-projects"
            type="text"
            placeholder="SEARCH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-32 sm:w-48 bg-transparent pl-9 pr-3 py-1.5 text-[11px] font-bold tracking-wider uppercase text-white placeholder:text-neutral-600 focus:outline-none transition-all focus:w-40 sm:focus:w-64"
          />
        </div>

        <div className="h-6 w-px bg-neutral-700/50" />

        {/* Filters Section */}
        <div className="flex items-center gap-1">
          <Dropdown
            label="CAT"
            options={allCategories}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
          <Dropdown
            label="LANG"
            options={allLanguages}
            selected={selectedLanguages}
            onToggle={toggleLanguage}
          />
          <div className="h-6 w-px bg-neutral-700/50" />
          <SortDropdown 
            current={sortBy}
            onSelect={setSortBy}
          />
        </div>

        <div className="h-6 w-px bg-neutral-700/50" />

        {/* Actions Section */}
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400 transition-all hover:bg-neutral-800 hover:text-white">
            <span className="hidden sm:inline">Submit</span>
            <span className="sm:hidden">+</span>
          </button>

          {hasActiveFilters && (
            <>
              <div className="h-6 w-px bg-neutral-700/50" />
              <button
                onClick={clearFilters}
                className="flex items-center justify-center rounded-full p-1.5 text-neutral-500 transition-all hover:bg-neutral-800 hover:text-white"
                title="Clear Filters"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
