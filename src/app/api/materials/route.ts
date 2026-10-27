import { MaterialType, Probidhan, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const materialTypes = Object.values(MaterialType);
const probidhans = Object.values(Probidhan);

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

  const where: Prisma.MaterialWhereInput = {};
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
