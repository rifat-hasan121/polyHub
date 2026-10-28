import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        polytechnic: true,
        department: true,
        probidhan: true,
        semester: true,
        createdAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const [communityPosts, higherStudyPosts] = await Promise.all([
      prisma.communityPost.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          content: true,
          imageUrl: true,
          department: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      }),
      prisma.$queryRaw<{
        id: string;
        title: string;
        description: string;
        category: string;
        department: string | null;
        subject: string | null;
        year: number | null;
        fileUrl: string | null;
        videoUrl: string | null;
        status: string;
        createdAt: Date;
        comments: bigint;
      }[]>`
        SELECT resource."id", resource."title", resource."description",
          resource."category", resource."department", resource."subject",
          resource."year", resource."fileUrl", resource."videoUrl",
          resource."status", resource."createdAt",
          (SELECT COUNT(*) FROM "HigherStudyComment" comment
            WHERE comment."resourceId" = resource."id") AS "comments"
        FROM "HigherStudyResource" resource
        WHERE resource."userId" = ${userId}
          AND (
            (resource."status" = 'APPROVED' AND resource."isVerified" = TRUE)
            OR (${isOwner} = TRUE)
          )
        ORDER BY resource."createdAt" DESC
        LIMIT 50
      `,
    ]);

    const posts = [
      ...communityPosts.map((post) => ({
        id: post.id,
        kind: "COMMUNITY" as const,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        department: post.department,
        comments: post._count.comments,
        createdAt: post.createdAt,
      })),
      ...higherStudyPosts.map((post) => ({
        id: post.id,
        kind: "HIGHER_STUDY" as const,
        title: post.title,
        content: post.description,
        imageUrl: null,
        category: post.category,
        department: post.department,
        subject: post.subject,
        year: post.year,
        fileUrl: post.fileUrl,
        videoUrl: post.videoUrl,
        status: post.status,
        comments: Number(post.comments),
        createdAt: post.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ profile: user, posts });
  } catch (error) {
    console.error("Failed to load public user profile:", error);
    return NextResponse.json({ error: "Unable to load this profile." }, { status: 500 });
  }
}
