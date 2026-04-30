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
      className="glass-card p-5 block group animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={project.owner.avatarUrl}
            alt={project.owner.login}
            className="w-9 h-9 rounded-full ring-1 ring-white/10 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-muted truncate">{project.owner.login}</p>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          className="text-muted-2 group-hover:text-purple-400 transition-colors shrink-0 mt-1"
        />
      </div>

      {/* Summary */}
      <p className="text-[13px] text-[#aaa] leading-relaxed mb-4 line-clamp-2">
        {project.summary || project.description || "No description available."}
      </p>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="badge badge-accent">{project.category}</span>
        <span className={`badge ${getDifficultyBadge(project.difficulty)}`}>
          {project.difficulty}
        </span>
        {project.language && (
          <span className="badge badge-neutral">{project.language}</span>
        )}
        {project.goodFirstIssues && project.goodFirstIssues > 0 && (
          <span className="badge badge-green">
            <Tag size={10} />
            {project.goodFirstIssues} good first issues
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="stat-pill">
            <Star size={13} className="text-yellow-500/80" />
            {project.stars.toLocaleString()}
          </span>
          <span className="stat-pill">
            <GitFork size={13} />
            {project.forks.toLocaleString()}
          </span>
          <span className="stat-pill text-xs">
            Updated {timeAgo(project.updatedAt)}
          </span>
        </div>

        {/* Contributors Avatars */}
        {project.trackedContributors.length > 0 && (
          <div className="flex items-center gap-1">
            <Users size={12} className="text-muted-2 mr-1" />
            <span className="text-xs text-muted-2">
              {project.trackedContributors.length}
            </span>
          </div>
        )}
      </div>

      {/* Contribution Areas (show on hover — CSS controlled) */}
      {project.contributionAreas.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[11px] text-muted-2 uppercase tracking-wider mb-1.5">
            Contribute to
          </p>
          <div className="flex flex-wrap gap-1">
            {project.contributionAreas.slice(0, 3).map((area) => (
              <span key={area} className="badge badge-neutral text-[11px]">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
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
