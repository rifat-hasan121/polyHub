import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const commentSchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const comments = await prisma.$queryRaw<{
      id: string;
      content: string;
      createdAt: Date;
      authorId: string;
      authorName: string;
      authorImage: string | null;
      authorPolytechnic: string | null;
    }[]>`
      SELECT comment."id", comment."content", comment."createdAt",
        author."id" AS "authorId", author."name" AS "authorName",
        author."image" AS "authorImage", author."polytechnic" AS "authorPolytechnic"
      FROM "HigherStudyComment" comment
      JOIN "User" author ON author."id" = comment."userId"
      JOIN "HigherStudyResource" resource ON resource."id" = comment."resourceId"
      WHERE comment."resourceId" = ${id}
        AND resource."status" = 'APPROVED' AND resource."isVerified" = TRUE
      ORDER BY comment."createdAt" ASC
      LIMIT 100
    `;
    return NextResponse.json({
      comments: comments.map(({ authorId, authorName, authorImage, authorPolytechnic, ...comment }) => ({
        ...comment,
        author: { id: authorId, name: authorName, image: authorImage, polytechnic: authorPolytechnic },
      })),
    });
  } catch (error) {
    console.error("Failed to load higher-study comments:", error);
    return NextResponse.json({ error: "Unable to load comments." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to comment on a post." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Comment must be between 1 and 2000 characters." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const [resource] = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "HigherStudyResource"
      WHERE "id" = ${id} AND "status" = 'APPROVED' AND "isVerified" = TRUE
    `;
    if (!resource) {
      return NextResponse.json({ error: "Approved higher-study post was not found." }, { status: 404 });
    }

    const commentId = randomUUID();
    const [comment] = await prisma.$queryRaw<{
      id: string;
      content: string;
      createdAt: Date;
      authorName: string;
      authorImage: string | null;
      authorPolytechnic: string | null;
    }[]>`
      WITH inserted AS (
        INSERT INTO "HigherStudyComment" ("id", "content", "resourceId", "userId", "createdAt")
        VALUES (${commentId}, ${parsed.data.content}, ${id}, ${session.user.id}, NOW())
        RETURNING "id", "content", "createdAt", "userId"
      )
      SELECT inserted."id", inserted."content", inserted."createdAt",
        author."name" AS "authorName", author."image" AS "authorImage",
        author."polytechnic" AS "authorPolytechnic"
      FROM inserted JOIN "User" author ON author."id" = inserted."userId"
    `;
    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: session.user.id,
          name: comment.authorName,
          image: comment.authorImage,
          polytechnic: comment.authorPolytechnic,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create higher-study comment:", error);
    return NextResponse.json({ error: "Unable to publish your comment." }, { status: 500 });
  }
}
