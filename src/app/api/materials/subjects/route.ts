import { Probidhan, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const probidhans = Object.values(Probidhan);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const department = params.get("department")?.trim().toUpperCase();
  const semesterParam = params.get("semester");
  const probidhan = params.get("probidhan");

  if (department && !/^[A-Z0-9_-]{1,20}$/.test(department)) {
    return NextResponse.json({ error: "Department must be a valid department code." }, { status: 400 });
  }
  if (probidhan && !probidhans.includes(probidhan as Probidhan)) {
    return NextResponse.json({ error: "Probidhan is not supported." }, { status: 400 });
  }

  let semester: number | undefined;
  if (semesterParam) {
    semester = Number(semesterParam);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json({ error: "Semester must be a number from 1 to 8." }, { status: 400 });
    }
  }

  const where: Prisma.SubjectWhereInput = {};
  if (semester !== undefined) where.semester = semester;
  if (probidhan) where.probidhan = probidhan as Probidhan;
  if (department) where.department = { is: { code: department } };

  try {
    const subjects = await prisma.subject.findMany({
      where,
      take: 500,
      orderBy: [{ semester: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        semester: true,
        probidhan: true,
        department: { select: { name: true, code: true } },
      },
    });
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Failed to load subjects for material submissions:", error);
    return NextResponse.json({ error: "Unable to load subjects right now." }, { status: 500 });
  }
}
