import { MaterialType, Probidhan, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const materialTypes = Object.values(MaterialType);
const probidhans = Object.values(Probidhan);
const subjectDepartments = {
  CST: "Computer Science & Technology",
  CE: "Civil Technology",
  EEE: "Electrical & Electronic Engineering",
  ME: "Mechanical Technology",
  POWER: "Power Technology",
  ET: "Electronics Technology",
  RAC: "Refrigeration & Air Conditioning",
} as const;
const materialSubmissionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  fileUrl: z.string().trim().url().max(2048).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "File URL must use http or https."),
  type: z.enum(materialTypes),
  probidhan: z.enum(probidhans),
  subjectId: z.string().trim().min(1).max(100).nullable().optional(),
  newSubject: z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,20}$/),
    department: z.enum(["CST", "CE", "EEE", "ME", "POWER", "ET", "RAC"]),
    semester: z.number().int().min(1).max(8),
  }).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
}).refine(
  (payload) => Boolean(payload.subjectId) !== Boolean(payload.newSubject),
  "Choose an existing subject or provide new subject details.",
);

function isOneOf<T extends string>(
  value: string | null,
  options: readonly T[],
): value is T {
  return value !== null && options.includes(value as T);
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const department = searchParams.get("department")?.trim().toUpperCase();
  const semesterParam = searchParams.get("semester");
  const rawProbidhan = searchParams.get("probidhan");
  const rawType = searchParams.get("type");
  const search = searchParams.get("search")?.trim();

  if (department && !/^[A-Z0-9_-]{1,20}$/.test(department)) {
    return NextResponse.json(
      { error: "Department must be a valid department code." },
      { status: 400 },
    );
  }

  let semester: number | undefined;
  if (semesterParam) {
    semester = Number(semesterParam);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json(
        { error: "Semester must be a number from 1 to 8." },
        { status: 400 },
      );
    }
  }

  if (rawProbidhan && !isOneOf(rawProbidhan, probidhans)) {
    return NextResponse.json(
      { error: "Probidhan must be PROBIDHAN_2016 or PROBIDHAN_2022." },
      { status: 400 },
    );
  }

  if (rawType && !isOneOf(rawType, materialTypes)) {
    return NextResponse.json(
      { error: "Material type is not supported." },
      { status: 400 },
    );
  }

  if (search && search.length > 120) {
    return NextResponse.json(
      { error: "Search text must be 120 characters or fewer." },
      { status: 400 },
    );
  }

  const probidhanParam = rawProbidhan && isOneOf(rawProbidhan, probidhans)
    ? rawProbidhan
    : undefined;
  const typeParam = rawType && isOneOf(rawType, materialTypes) ? rawType : undefined;

  const subjectWhere: Prisma.SubjectWhereInput = {};
  if (semester !== undefined) {
    subjectWhere.semester = semester;
  }
  if (department) {
    subjectWhere.department = { is: { code: department } };
  }

  const where: Prisma.MaterialWhereInput = { status: "APPROVED" };
  if (probidhanParam) {
    where.probidhan = probidhanParam;
  }

  if (typeParam) {
    where.type = typeParam;
  }
  if (semester !== undefined || department) {
    where.subject = { is: subjectWhere };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { subject: { is: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  try {
    const materials = await prisma.material.findMany({
      where,
      take: 30,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        type: true,
        probidhan: true,
        createdAt: true,
        subject: {
          select: {
            name: true,
            code: true,
            semester: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      materials,
      count: materials.length,
      limit: 30,
    });
  } catch (error) {
    console.error("Failed to fetch academic materials:", error);
    return NextResponse.json(
      { error: "Unable to load materials right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to upload a material." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = materialSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the material details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    let subject = parsed.data.subjectId
      ? await prisma.subject.findUnique({
          where: { id: parsed.data.subjectId },
          select: { id: true, probidhan: true },
        })
      : null;

    if (!subject && parsed.data.newSubject) {
      const { name, code, department: departmentCode, semester } = parsed.data.newSubject;
      const departmentName = subjectDepartments[departmentCode];
      const department = await prisma.department.upsert({
        where: { code: departmentCode },
        create: { code: departmentCode, name: departmentName },
        update: {},
        select: { id: true },
      });

      subject = await prisma.subject.upsert({
        where: {
          code_probidhan: {
            code,
            probidhan: parsed.data.probidhan,
          },
        },
        create: {
          name,
          code,
          semester,
          probidhan: parsed.data.probidhan,
          departmentId: department.id,
        },
        update: {},
        select: { id: true, probidhan: true },
      });
    }

    if (!subject || subject.probidhan !== parsed.data.probidhan) {
      return NextResponse.json(
        { error: "Select a valid subject for the chosen Probidhan." },
        { status: 400 },
      );
    }

    const material = await prisma.material.create({
      data: {
        title: parsed.data.title,
        fileUrl: parsed.data.fileUrl,
        type: parsed.data.type,
        probidhan: parsed.data.probidhan,
        subjectId: subject.id,
        year: parsed.data.year ?? null,
        userId: session.user.id,
        status: session.user.role === "ADMIN" ? "APPROVED" : "PENDING",
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit academic material:", error);
    return NextResponse.json({ error: "Unable to submit the material right now." }, { status: 500 });
  }
}
