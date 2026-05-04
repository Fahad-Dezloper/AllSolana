"use client";

import { Star, GitFork, Tag, Users, ArrowUpRight } from "lucide-react";
import type { SolanaProject } from "@/lib/types";

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "Beginner":
      return "badge-green";
    case "Intermediate":
      return "badge-orange";
    case "Advanced":
      return "badge-red";
    default:
      return "badge-neutral";
  }
}

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
      className="glass-card p-5 block group cursor-pointer border-l-4 border-l-transparent hover:border-l-accent"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={project.owner.avatarUrl}
            alt={project.owner.login}
            className="w-8 h-8 ring-1 ring-white/10 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-white truncate group-hover:text-accent transition-colors uppercase tracking-wider">
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

      {/* Summary */}
      <p className="text-[13px] text-[#aaa] leading-relaxed mb-6 line-clamp-2 font-light">
        {project.summary || project.description || "No description available."}
      </p>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-2 uppercase font-bold tracking-tighter">Category</span>
          <div className="flex">
            <span className="badge badge-accent text-[10px]">{project.category}</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-2 uppercase font-bold tracking-tighter">Languages</span>
          <div className="flex flex-wrap gap-1">
            {project.languages.length > 0 ? (
              project.languages.slice(0, 3).map((lang) => (
                <span key={lang.name} className="badge badge-neutral text-[10px]">
                  {lang.name}
                </span>
              ))
            ) : (
              <span className="badge badge-neutral text-[10px]">Unknown</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="stat-pill">
            <Star size={12} className="text-muted-2" />
            <span className="font-mono text-[11px]">{project.stars.toLocaleString()}</span>
          </span>
          <span className="stat-pill">
            <GitFork size={12} className="text-muted-2" />
            <span className="font-mono text-[11px]">{project.forks.toLocaleString()}</span>
          </span>
          <span className="stat-pill">
            <div className="w-1.5 h-1.5 bg-accent-secondary" />
            <span className="font-mono text-[11px] text-accent-secondary">{project.openIssues} Issues</span>
          </span>
        </div>
        <span className="text-[10px] text-muted-2 font-mono uppercase">
          {timeAgo(project.pushedAt)}
        </span>
      </div>
    </a>
  );
}

/**
 * Skeleton loader for ProjectCard.
 */
export function ProjectCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 mb-1.5" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-3/4 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
      <div className="flex gap-4">
        <div className="skeleton h-3 w-12" />
        <div className="skeleton h-3 w-10" />
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  );
}
