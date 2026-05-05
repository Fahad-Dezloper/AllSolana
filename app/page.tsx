import { Suspense } from "react";
import { connection } from "next/server";
import { getSolanaProjects } from "@/lib/projects";
import { Dashboard } from "@/components/Dashboard";
import { ProjectCardSkeleton } from "@/components/ProjectCard";
import type { ProjectsResponse } from "@/lib/types";
import { TRACKED_USERS } from "@/lib/config";

function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col font-sans min-h-screen">
      {/* TopBar Skeleton */}
      <header className="sticky top-0 z-30 bg-background border-b border-white/10 px-8 py-2">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 h-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="skeleton w-5 h-4" />
              <div className="skeleton h-5 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-8 border-l border-white/10 pl-8 h-10">
            <div className="skeleton h-8 w-16" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 px-8 py-6 pb-32">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>

      {/* BottomBar Skeleton */}
      <section className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-700/50 bg-neutral-900/90 px-2 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:gap-2 sm:px-3 w-full max-w-lg">
          <div className="skeleton h-8 w-full rounded-full" />
        </div>
      </section>
    </div>
  );
}

async function ProjectsDashboard() {
  await connection();

  let data: ProjectsResponse;

  try {
    data = await getSolanaProjects();
  } catch (error) {
    console.error("[Page] Failed to load projects:", error);
    data = {
      projects: [],
      lastUpdated: new Date().toISOString(),
      totalTrackedUsers: TRACKED_USERS.length,
      totalReposScanned: 0,
    };
  }

  return <Dashboard data={data} />;
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ProjectsDashboard />
    </Suspense>
  );
}
