import { Suspense } from "react";
import { connection } from "next/server";
import { getSolanaProjects } from "@/lib/projects";
import { Dashboard } from "@/components/Dashboard";
import { ProjectCardSkeleton } from "@/components/ProjectCard";
import type { ProjectsResponse } from "@/lib/types";
import { TRACKED_USERS } from "@/lib/config";

function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="pt-16 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton h-4 w-36 mb-4 rounded-full" />
          <div className="skeleton h-12 w-80 mb-3" />
          <div className="skeleton h-12 w-96 mb-4" />
          <div className="skeleton h-5 w-[500px] mb-2" />
          <div className="skeleton h-5 w-[400px] mb-8" />
          <div className="flex gap-6">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-5 w-36" />
            <div className="skeleton h-5 w-32" />
          </div>
        </div>
      </header>

      <section className="px-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton h-12 w-full mb-4 rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="skeleton h-4 w-32 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
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
