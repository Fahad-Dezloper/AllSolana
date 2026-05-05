"use client";

import Image from "next/image";

interface TopBarProps {
  projectsCount: number;
}

export function TopBar({ projectsCount }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-white/10 px-4 sm:px-8 py-3 sm:py-2">
      <div className="max-w-8xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-4">
              <Image 
                src="/logo/solanaLogoMark.svg" 
                width={20} 
                height={16} 
                className="w-full h-full object-contain" 
                alt="Solana Logo" 
              />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tighter uppercase">
              CONTRIBUTE
            </h1>
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-2 uppercase tracking-tight font-medium">
            High-density index of active repositories on Solana
          </p>
        </div>

        <div className="flex items-center gap-8 border-l-0 md:border-l border-white/10 md:pl-8 h-auto md:h-10">
          <div className="flex flex-col justify-center">
            <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none mb-1">
              Index Size
            </span>
            <span className="text-lg font-bold font-mono text-white leading-none">
              {projectsCount}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
