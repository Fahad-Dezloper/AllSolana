import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const runs = await prisma.pipelineRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 5
  });
  console.log(runs);
}

main();
