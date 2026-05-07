import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { fullName, ownerLogin, summary, submittedBy } = await request.json();

    if (!fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Extract owner from fullName if not provided
    const derivedOwner = ownerLogin || fullName.split("/")[0];

    const project = await prisma.project.upsert({
      where: { fullName },
      update: {
        submittedBy: submittedBy || null,
        isPending: false, 
        isSolanaRelated: true,
      },
      create: {
        fullName,
        ownerLogin: derivedOwner,
        summary: summary || "",
        submittedBy: submittedBy || null,
        isPending: false, 
        category: "Other",
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
