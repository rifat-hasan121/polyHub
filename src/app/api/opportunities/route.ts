import { JobType, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const jobTypes = Object.values(JobType);
const departmentCode = /^[A-Z0-9_-]{1,20}$/;

const createOpportunitySchema = z.object({
  title: z.string().trim().min(2).max(160),
  companyName: z.string().trim().min(2).max(120),
  location: z.string().trim().min(1).max(120),
  type: z.enum(jobTypes),
  description: z.string().trim().min(10).max(10000),
  applyUrl: z
    .union([
      z.string().url().max(2048).refine((value) => /^https?:\/\//i.test(value)),
      z.literal(""),
    ])
    .optional(),
  department: z.array(z.string().trim().toUpperCase().regex(departmentCode)).min(1).max(20),
  deadline: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .nullable()
    .optional(),
});

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const rawTypes = searchParams.getAll("type");
  const departments = [
    ...new Set(
      searchParams
        .getAll("department")
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  const location = searchParams.get("location")?.trim();
  const search = searchParams.get("search")?.trim();

  if (rawTypes.some((type) => !jobTypes.includes(type as JobType))) {
    return NextResponse.json({ error: "Opportunity type is not supported." }, { status: 400 });
  }
  if (departments.some((department) => !departmentCode.test(department))) {
    return NextResponse.json({ error: "Department must be a valid department code." }, { status: 400 });
  }
  if (location && location.length > 120) {
    return NextResponse.json({ error: "Location must be 120 characters or fewer." }, { status: 400 });
  }
  if (search && search.length > 120) {
    return NextResponse.json({ error: "Search text must be 120 characters or fewer." }, { status: 400 });
  }

  const where: Prisma.OpportunityWhereInput = {};
  if (rawTypes.length === 1) {
    where.type = rawTypes[0] as JobType;
  } else if (rawTypes.length > 1) {
    where.type = { in: rawTypes as JobType[] };
  }
  if (departments.length > 0) {
    where.department = { hasSome: departments };
  }
  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const opportunities = await prisma.opportunity.findMany({
      where,
      take: 50,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ opportunities, count: opportunities.length, limit: 50 });
  } catch (error) {
    console.error("Failed to fetch opportunities:", error);
    return NextResponse.json({ error: "Unable to load opportunities right now." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an administrator can create opportunity listings." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createOpportunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the opportunity details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        ...parsed.data,
        applyUrl: parsed.data.applyUrl || null,
        deadline: parsed.data.deadline ?? null,
      },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error("Failed to create opportunity:", error);
    return NextResponse.json(
      { error: "Unable to create the opportunity listing." },
      { status: 500 },
    );
  }
}
