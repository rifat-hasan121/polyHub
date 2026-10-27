import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
  title: z.string().trim().min(5).max(160),
  content: z.string().trim().min(10).max(10000),
  department: z.string().trim().max(40).optional(),
  imageUrl: z.union([z.string().url().max(2048), z.literal("")]).optional(),
});

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const department = params.get("department")?.trim().toUpperCase();
  const search = params.get("search")?.trim();
  const page = Number(params.get("page") ?? "1");
  const limit = Number(params.get("limit") ?? "10");

  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json({ error: "Page must be a positive integer." }, { status: 400 });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) {
    return NextResponse.json({ error: "Limit must be between 1 and 30." }, { status: 400 });
  }
  if (department && !/^[A-Z0-9_-]{1,40}$/.test(department)) {
    return NextResponse.json({ error: "Invalid department filter." }, { status: 400 });
  }
  if (search && search.length > 120) {
    return NextResponse.json({ error: "Search must be 120 characters or fewer." }, { status: 400 });
  }

  const where: Prisma.CommunityPostWhereInput = {};
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.communityPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, image: true, polytechnic: true },
          },
          _count: { select: { comments: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return NextResponse.json({ posts, page, limit, total, hasMore: page * limit < total });
  } catch (error) {
    console.error("Failed to fetch community posts:", error);
    return NextResponse.json({ error: "Unable to load discussions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to publish a discussion." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your post details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true },
    });
    if (!author) {
      return NextResponse.json({ error: "Your user profile could not be found." }, { status: 401 });
    }

    const post = await prisma.communityPost.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        department: parsed.data.department || author.department || "General",
        imageUrl: parsed.data.imageUrl || null,
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true, polytechnic: true } },
        _count: { select: { comments: true } },
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Failed to create community post:", error);
    return NextResponse.json({ error: "Unable to publish your discussion." }, { status: 500 });
  }
}
