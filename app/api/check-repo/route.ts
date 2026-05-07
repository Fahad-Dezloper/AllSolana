import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullName = searchParams.get("fullName");

  if (!fullName) {
    return NextResponse.json({ error: "Missing fullName" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { fullName: fullName.toLowerCase() },
  });

  return NextResponse.json({ exists: !!project });
}
