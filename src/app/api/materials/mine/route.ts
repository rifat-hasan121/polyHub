import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your uploaded materials." }, { status: 401 });
  }

  try {
    const materials = await prisma.material.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        type: true,
        probidhan: true,
        status: true,
        rejectionReason: true,
        year: true,
        subjectId: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
            code: true,
            semester: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
    });
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Failed to load user's uploaded materials:", error);
    return NextResponse.json({ error: "Unable to load your materials." }, { status: 500 });
  }
}
