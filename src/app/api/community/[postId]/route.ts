import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { postId } = await params;
  if (!/^c[a-z0-9]{24}$/i.test(postId)) {
    return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
  }

  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, name: true, image: true, polytechnic: true },
        },
        _count: { select: { comments: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to fetch community discussion:", error);
    return NextResponse.json({ error: "Unable to load this discussion." }, { status: 500 });
  }
}
