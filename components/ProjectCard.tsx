"use client";

import { Star, GitFork, ArrowUpRight } from "lucide-react";
import type { SolanaProject } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function ProjectCard({
  project,
  index,
}: {
  project: SolanaProject;
  index: number;
}) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      id={`project-${project.fullName.replace("/", "-")}`}
      className="bg-fd-card p-6 flex flex-col h-full group cursor-pointer border-l-4 border-l-transparent hover:border-l-accent transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={project.owner.avatarUrl}
            alt={project.owner.login}
            className="w-8 h-8  shrink-0"
            // w-6 h-6 ring-1 ring-white/5 grayscale group-hover:grayscale-0 transition-all shrink-0
          />
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-white truncate uppercase tracking-wider group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <p className="text-[11px] text-muted truncate font-mono uppercase">{project.owner.login}</p>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          className="text-muted-2 group-hover:text-accent transition-colors shrink-0"
        />
      </div>

      <p className="text-[13px] text-[#aaa] leading-relaxed mb-6 line-clamp-2 font-light flex-grow">
        {project.summary || project.description || "No description available."}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="badge badge-accent text-[10px]">
          {project.category}
        </span>
        {project.languages.slice(0, 2).map((lang) => (
          <span key={lang.name} className="badge badge-neutral text-[10px]">
            {lang.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-4">
          <div className="stat-pill">
            <Star size={12} className="text-muted-2" />
            <span className="font-mono text-[11px] text-white">{project.stars.toLocaleString()}</span>
          </div>
          <div className="stat-pill">
            <GitFork size={12} className="text-muted-2" />
            <span className="font-mono text-[11px] text-white">{project.forks.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-pill">
            <div className="w-1.5 h-1.5 bg-accent-secondary" />
            <span className="font-mono text-[11px] text-accent-secondary">{project.openIssues} ISSUES</span>
          </div>
        {/* <span className="text-[10px] text-muted-2 font-mono uppercase">
          {timeAgo(project.pushedAt)}
        </span> */}
      </div>
    </a>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div className="skeleton w-8 h-8" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 mb-1.5" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-3/4 mb-4" />
      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between">
        <div className="flex gap-4">
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-3 w-10" />
        </div>
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  );
}
