import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const projects = await prisma.project.findMany({
   select: { fullName: true, ownerLogin: true, category: true }
    });
  console.log(projects);
}

main();
