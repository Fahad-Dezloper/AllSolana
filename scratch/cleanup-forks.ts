import { prisma } from "../lib/db";
import { fetchLiveRepoData } from "../lib/github";

async function main() {
  const projects = await prisma.project.findMany({
    include: { contributors: true },
  });

  console.log(`Auditing ${projects.length} projects for forks...`);

  const fullNames = projects.map(p => p.fullName);
  const liveDataMap = await fetchLiveRepoData(fullNames);

  for (const project of projects) {
    const live = liveDataMap.get(project.fullName);
    if (!live) continue;

    if (live.isFork && live.parentName) {
      const originalFullName = live.parentName;
      console.log(`[Fork] ${project.fullName} → Original: ${originalFullName}`);

      // 1. Ensure original repo exists in DB
      let originalProject = await prisma.project.findUnique({
        where: { fullName: originalFullName },
      });

      if (!originalProject) {
        console.log(`[Creating] Original repo ${originalFullName}...`);
        originalProject = await prisma.project.create({
          data: {
            fullName: originalFullName,
            ownerLogin: originalFullName.split("/")[0],
            isSolanaRelated: true,
            confidence: project.confidence,
            category: project.category,
            summary: project.summary,
            difficulty: project.difficulty,
            keyFeatures: project.keyFeatures,
            analysisSource: "fork_resolution",
          },
        });
      }

      // 2. Transfer contributors
      for (const contrib of project.contributors) {
        try {
          await prisma.projectContributor.upsert({
            where: {
              projectId_userId: {
                projectId: originalProject.id,
                userId: contrib.userId,
              },
            },
            update: {},
            create: {
              projectId: originalProject.id,
              userId: contrib.userId,
            },
          });
        } catch (e) {
          // Ignore unique constraint errors
        }
      }

      // 3. Delete the fork
      await prisma.project.delete({ where: { id: project.id } });
      console.log(`[Deleted] Fork ${project.fullName} removed.`);
    }
  }

  console.log("Cleanup complete!");
}

main().catch(console.error);
