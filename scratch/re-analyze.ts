import { prisma } from "../lib/db";
import { analyzeWithAI } from "../lib/ai-analyst";
import { fetchLiveRepoData } from "../lib/github";

async function main() {
  const projects = await prisma.project.findMany({
    where: { category: "Other" },
  });

  console.log(`Re-analyzing ${projects.length} projects with "Other" category...`);

  const fullNames = projects.map(p => p.fullName);
  const liveDataMap = await fetchLiveRepoData(fullNames);

  for (const project of projects) {
    const live = liveDataMap.get(project.fullName);
    if (!live) {
      console.warn(`[Skip] ${project.fullName}: No live data found.`);
      continue;
    }

    console.log(`[Re-analyzing] ${project.fullName}...`);
    try {
      const analysis = await analyzeWithAI(live, []); // Using empty signals since we have live data
      
      await prisma.project.update({
        where: { id: project.id },
        data: {
          category: analysis.category,
          summary: analysis.summary,
          confidence: analysis.confidence,
          difficulty: analysis.difficulty,
          keyFeatures: analysis.keyFeatures,
          analysisSource: "ai_manual_recalc",
        },
      });
      console.log(`[Success] ${project.fullName} → ${analysis.category}`);
    } catch (err) {
      console.error(`[Error] ${project.fullName}:`, (err as Error).message);
    }
    
    // Sleep to avoid rate limiting if needed, though analyzeWithAI has internal sleep
  }
  
  console.log("Re-analysis complete!");
}

main().catch(console.error);
