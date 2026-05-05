import { prisma } from "../lib/db";

async function main() {
  const projects = await prisma.project.findMany({
    select: { fullName: true, ownerLogin: true }
  });
  console.log("Current projects in DB:");
  projects.forEach(p => console.log(`- ${p.fullName} (Owner: ${p.ownerLogin})`));

  // Find duplicates or forks
  const repoNames = projects.map(p => p.fullName.split("/")[1]);
  const counts = repoNames.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log("\nPotential duplicates (by repo name):");
    duplicates.forEach(([name, count]) => console.log(`- ${name}: ${count} entries`));
  }
}

main().catch(console.error);
