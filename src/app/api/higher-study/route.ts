import { HigherStudyCategory, HigherStudyResourceType, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { higherStudySubmissionSchema } from "@/lib/higher-study-validation";
import { prisma } from "@/lib/prisma";

const categories = Object.values(HigherStudyCategory);
const resourceTypes = Object.values(HigherStudyResourceType);
const departmentCode = /^[A-Z0-9_-]{1,20}$/;

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const category = searchParams.get("category")?.trim();
  const department = searchParams.get("department")?.trim().toUpperCase();
  const subject = searchParams.get("subject")?.trim();
  const search = searchParams.get("search")?.trim();
  const resourceType = searchParams.get("resourceType")?.trim();

  if (category && !categories.includes(category as HigherStudyCategory)) {
    return NextResponse.json({ error: "Higher study category is not supported." }, { status: 400 });
  }

  if (department && !departmentCode.test(department)) {
    return NextResponse.json({ error: "Department must be a valid department code." }, { status: 400 });
  }
  if (subject && subject.length > 80) {
    return NextResponse.json({ error: "Subject must be 80 characters or fewer." }, { status: 400 });
  }
  if (search && search.length > 120) {
    return NextResponse.json({ error: "Search text must be 120 characters or fewer." }, { status: 400 });
  }
  if (resourceType && !resourceTypes.includes(resourceType as HigherStudyResourceType)) {
    return NextResponse.json({ error: "Resource type is not supported." }, { status: 400 });
  }

  const where: Prisma.HigherStudyResourceWhereInput = {};
  where.isVerified = true;
  where.status = "APPROVED";
  if (category) where.category = category as HigherStudyCategory;
  if (department) where.department = department;
  if (subject) where.subject = { equals: subject, mode: "insensitive" };
  if (resourceType) where.resourceType = resourceType as HigherStudyResourceType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const resources = await prisma.higherStudyResource.findMany({
      where,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ resources, count: resources.length });
  } catch (error) {
    console.error("Failed to fetch higher study resources:", error);
    return NextResponse.json({ error: "Unable to load higher study resources right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to submit a higher-study resource." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = higherStudySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the resource details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const id = randomUUID();
    const [resource] = await prisma.$queryRaw<{ id: string; title: string; status: string }[]>`
      INSERT INTO "HigherStudyResource" (
        "id", "title", "description", "category", "resourceType", "isVerified",
        "department", "subject", "year", "fileUrl", "videoUrl", "status", "userId"
      )
      VALUES (
        ${id},
        ${parsed.data.title},
        ${parsed.data.description},
        ${parsed.data.category}::"HigherStudyCategory",
        'STUDY_MATERIAL'::"HigherStudyResourceType",
        FALSE,
        ${parsed.data.department ?? null},
        ${parsed.data.subject ?? null},
        ${parsed.data.year ?? null},
        ${parsed.data.fileUrl ?? null},
        ${parsed.data.videoUrl ?? null},
        'PENDING'::"MaterialStatus",
        ${session.user.id}
      )
      RETURNING "id", "title", "status"
    `;
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit higher-study resource:", error);
    return NextResponse.json({ error: "Unable to submit the resource right now." }, { status: 500 });
  }
}
