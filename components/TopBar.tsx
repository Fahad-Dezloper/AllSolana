"use client";

import Image from "next/image";
// import { Twitter } from "lucide-react";

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

        <div className="flex items-center gap-6">
          {/* Index Size Indicator */}
          <div className="flex flex-col justify-center border-r border-white/10 pr-6 h-10">
            <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none mb-1">
              Index Size
            </span>
            <span className="text-lg font-bold font-mono text-white leading-none">
              {projectsCount}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Built by X */}
            <a
              href="https://x.com/dezloperr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none mb-1 group-hover:text-solana-green transition-colors">
                  Built by
                </span>
                <span className="text-[11px] font-black text-white uppercase tracking-tight group-hover:underline decoration-solana-green underline-offset-4">
                  @dezloperr
                </span>
              </div>
            </a>

            <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

            {/* Star on GitHub */}
            <a
              href="https://github.com/Fahad-Dezloper/AllSolana"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 bg-neutral-900 border border-white/5 rounded-xl flex items-center justify-center group-hover:bg-neutral-800 transition-all shadow-2xl">
                <div className="w-[22px] h-[22px] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/github.svg"
                    width={14}
                    height={14}
                    alt="GitHub"
                    className="w-6 h-6 brightness-0 invert"
                  />
                </div>
              </div>
              <div className="flex flex-col h-full gap-1.5 justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                  Star us
                </span>
                <span className="text-[9px] text-muted-2 uppercase font-bold tracking-widest leading-none">
                  GitHub
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
