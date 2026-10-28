import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  try {
    const resources = await prisma.$queryRaw<{
      id: string;
      title: string;
      description: string;
      category: string;
      status: string;
      department: string | null;
      subject: string | null;
      year: number | null;
      fileUrl: string | null;
      videoUrl: string | null;
      createdAt: Date;
      authorId: string | null;
      authorName: string | null;
      authorImage: string | null;
      authorPolytechnic: string | null;
      likes: bigint;
      dislikes: bigint;
      comments: bigint;
      viewerReaction: string | null;
    }[]>`
      SELECT
        resource."id", resource."title", resource."description", resource."category", resource."status",
        resource."department", resource."subject", resource."year", resource."fileUrl",
        resource."videoUrl", resource."createdAt", author."id" AS "authorId",
        author."name" AS "authorName", author."image" AS "authorImage",
        author."polytechnic" AS "authorPolytechnic",
        (SELECT COUNT(*) FROM "HigherStudyReaction" reaction
          WHERE reaction."resourceId" = resource."id" AND reaction."type" = 'LIKE') AS "likes",
        (SELECT COUNT(*) FROM "HigherStudyReaction" reaction
          WHERE reaction."resourceId" = resource."id" AND reaction."type" = 'DISLIKE') AS "dislikes",
        (SELECT COUNT(*) FROM "HigherStudyComment" comment
          WHERE comment."resourceId" = resource."id") AS "comments",
        (SELECT reaction."type" FROM "HigherStudyReaction" reaction
          WHERE reaction."resourceId" = resource."id" AND reaction."userId" = ${viewerId}
          LIMIT 1) AS "viewerReaction"
      FROM "HigherStudyResource" resource
      LEFT JOIN "User" author ON author."id" = resource."userId"
      WHERE (
        (resource."status" = 'APPROVED' AND resource."isVerified" = TRUE)
        OR (${viewerId}::text IS NOT NULL AND resource."userId" = ${viewerId})
      )
      ORDER BY resource."createdAt" DESC
      LIMIT 100
    `;

    return NextResponse.json({
      resources: resources.map((resource) => ({
        ...resource,
        likes: Number(resource.likes),
        dislikes: Number(resource.dislikes),
        comments: Number(resource.comments),
        status: resource.status,
        author: {
          id: resource.authorId,
          name: resource.authorName ?? "PolyHub",
          image: resource.authorImage,
          polytechnic: resource.authorPolytechnic,
        },
      })),
    });
  } catch (error) {
    console.error("Failed to load higher-study feed:", error);
    return NextResponse.json({ error: "Unable to load higher-study posts." }, { status: 500 });
  }
}
