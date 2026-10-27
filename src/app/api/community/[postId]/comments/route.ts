import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

const commentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export async function GET(_request: Request, { params }: RouteContext) {
  const { postId } = await params;
  if (!/^c[a-z0-9]{24}$/i.test(postId)) {
    return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, polytechnic: true },
        },
      },
    });
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Failed to fetch community comments:", error);
    return NextResponse.json({ error: "Unable to load replies." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to reply to this discussion." }, { status: 401 });
  }

  const { postId } = await params;
  if (!/^c[a-z0-9]{24}$/i.test(postId)) {
    return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Reply must be between 1 and 5000 characters." },
      { status: 400 },
    );
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        postId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, polytechnic: true },
        },
      },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Discussion not found." }, { status: 404 });
    }
    console.error("Failed to add community comment:", error);
    return NextResponse.json({ error: "Unable to publish your reply." }, { status: 500 });
  }
}
