import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to review materials." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  try {
    const materials = await prisma.material.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        title: true,
        fileUrl: true,
        type: true,
        probidhan: true,
        year: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
            code: true,
            semester: true,
            department: { select: { name: true, code: true } },
          },
        },
        user: { select: { name: true, polytechnic: true, email: true } },
      },
    });
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Failed to load pending materials:", error);
    return NextResponse.json({ error: "Unable to load the moderation queue." }, { status: 500 });
  }
}
