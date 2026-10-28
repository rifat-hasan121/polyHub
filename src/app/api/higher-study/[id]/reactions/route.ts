import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const reactionSchema = z.object({ type: z.enum(["LIKE", "DISLIKE"]) });

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to react to a post." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose like or dislike." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const [post] = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "HigherStudyResource"
      WHERE "id" = ${id} AND "status" = 'APPROVED' AND "isVerified" = TRUE
    `;
    if (!post) {
      return NextResponse.json({ error: "Approved higher-study post was not found." }, { status: 404 });
    }

    const reactionId = randomUUID();
    const [reaction] = await prisma.$queryRaw<{ type: string }[]>`
      INSERT INTO "HigherStudyReaction" ("id", "resourceId", "userId", "type", "createdAt", "updatedAt")
      VALUES (${reactionId}, ${id}, ${session.user.id}, ${parsed.data.type}::"HigherStudyReactionType", NOW(), NOW())
      ON CONFLICT ("resourceId", "userId")
      DO UPDATE SET "type" = EXCLUDED."type", "updatedAt" = NOW()
      RETURNING "type"
    `;
    return NextResponse.json({ reaction: reaction.type });
  } catch (error) {
    console.error("Failed to save higher-study reaction:", error);
    return NextResponse.json({ error: "Unable to save your reaction." }, { status: 500 });
  }
}
