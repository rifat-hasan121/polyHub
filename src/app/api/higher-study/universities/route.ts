import { UniversityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search")?.trim();
  const rawType = searchParams.get("type")?.trim();
  const universityTypes = Object.values(UniversityType);

  if (search && search.length > 120) {
    return NextResponse.json({ error: "Search text must be 120 characters or fewer." }, { status: 400 });
  }
  if (rawType && !universityTypes.includes(rawType as UniversityType)) {
    return NextResponse.json({ error: "University type is not supported." }, { status: 400 });
  }

  try {
    const universities = await prisma.universityGuide.findMany({
      where: {
        ...(rawType ? { type: rawType as UniversityType } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ universities, count: universities.length });
  } catch (error) {
    console.error("Failed to fetch university guides:", error);
    return NextResponse.json({ error: "Unable to load university guides right now." }, { status: 500 });
  }
}
