import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete your higher-study submission." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const deleted = await prisma.$queryRaw<{ id: string }[]>`
      DELETE FROM "HigherStudyResource"
      WHERE "id" = ${id} AND "userId" = ${session.user.id}
      RETURNING "id"
    `;
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Your higher-study submission was not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user's higher-study submission:", error);
    return NextResponse.json({ error: "Unable to delete your submission." }, { status: 500 });
  }
}
