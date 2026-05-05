import { prisma } from "../lib/db";

async function main() {
  const count = await prisma.project.count();
  console.log(`Total projects in DB: ${count}`);
  const categories = await prisma.project.groupBy({
    by: ["category"],
    _count: true,
  });
  console.log("Categories distribution:", JSON.stringify(categories, null, 2));
}

main().catch(console.error);
