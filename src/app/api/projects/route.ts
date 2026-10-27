import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value));

const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(5000),
  thumbnail: z.union([httpUrl, z.literal("")]).optional(),
  repoUrl: z.union([httpUrl, z.literal("")]).optional(),
  liveUrl: z.union([httpUrl, z.literal("")]).optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .min(1)
    .max(12)
    .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]),
  department: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,20}$/),
});

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const department = searchParams.get("department")?.trim().toUpperCase();
  const tag = searchParams.get("tag")?.trim();
  const search = searchParams.get("search")?.trim();

  if (department && !/^[A-Z0-9_-]{1,20}$/.test(department)) {
    return NextResponse.json(
      { error: "Department must be a valid department code." },
      { status: 400 },
    );
  }
  if (tag && (tag.length > 30 || !/^[\p{L}\p{N}+#._ -]+$/u.test(tag))) {
    return NextResponse.json({ error: "Tag is not valid." }, { status: 400 });
  }
  if (search && search.length > 120) {
    return NextResponse.json(
      { error: "Search text must be 120 characters or fewer." },
      { status: 400 },
    );
  }

  const where: Prisma.ProjectWhereInput = {};
  if (department) where.department = department;
  if (tag) where.tags = { has: tag.toLowerCase() };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const projects = await prisma.project.findMany({
      where,
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, polytechnic: true },
        },
      },
    });

    return NextResponse.json({ projects, count: projects.length, limit: 50 });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Unable to load projects right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to submit a project." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your project details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        thumbnail: parsed.data.thumbnail || null,
        repoUrl: parsed.data.repoUrl || null,
        liveUrl: parsed.data.liveUrl || null,
        tags: parsed.data.tags,
        department: parsed.data.department,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, polytechnic: true },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Unable to submit your project right now." },
      { status: 500 },
    );
  }
}
