import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { classifyRepository } from "@/lib/ai-analyst";

export async function POST(request: Request) {
  try {
    const { fullName, ownerLogin, summary, submittedBy } = await request.json();

    if (!fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Extract owner from fullName if not provided
    const derivedOwner = ownerLogin || fullName.split("/")[0];

    // Use Gemini to intelligently categorize the repository
    const analysis = await classifyRepository(fullName, summary);

    const project = await prisma.project.upsert({
      where: { fullName },
      update: {
        submittedBy: submittedBy || null,
        isPending: false, 
        isSolanaRelated: true,
        category: analysis.category,
      },
      create: {
        fullName,
        ownerLogin: derivedOwner,
        summary: summary || "",
        submittedBy: submittedBy || null,
        isPending: false, 
        category: analysis.category,
        isSolanaRelated: true,
        analysisSource: "manual",
      },
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit repository" }, { status: 500 });
  }
}
