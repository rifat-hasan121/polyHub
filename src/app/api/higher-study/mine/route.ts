import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your higher-study submissions." }, { status: 401 });
  }

  try {
    const resources = await prisma.$queryRaw<{
      id: string;
      title: string;
      category: string;
      department: string | null;
      subject: string | null;
      description: string;
      fileUrl: string | null;
      videoUrl: string | null;
      year: number | null;
      status: string;
      rejectionReason: string | null;
      createdAt: Date;
    }[]>`
      SELECT "id", "title", "category", "department", "subject", "description",
        "fileUrl", "videoUrl", "year", "status", "rejectionReason", "createdAt"
      FROM "HigherStudyResource"
      WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC
    `;
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Failed to load user's higher-study submissions:", error);
    return NextResponse.json({ error: "Unable to load your higher-study submissions." }, { status: 500 });
  }
}
