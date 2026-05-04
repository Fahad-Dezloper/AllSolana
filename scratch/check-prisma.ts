import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  console.log("Models:", Object.keys(prisma));
  // @ts-ignore
  console.log("Project fields:", Object.keys(prisma.project));
}

main().catch(console.error);
