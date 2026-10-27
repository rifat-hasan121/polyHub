import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultPageSize = 15;
const maximumPageSize = 50;

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const type = searchParams.get("type");

  if (type === "notices") {
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const pageSize = parsePositiveInteger(
      searchParams.get("pageSize"),
      defaultPageSize,
    );
    const search = searchParams.get("search")?.trim();

    if (page === null) {
      return NextResponse.json({ error: "Page must be a positive integer." }, { status: 400 });
    }
    if (pageSize === null || pageSize > maximumPageSize) {
      return NextResponse.json(
        { error: `Page size must be between 1 and ${maximumPageSize}.` },
        { status: 400 },
      );
    }
    if (!Number.isSafeInteger((page - 1) * pageSize)) {
      return NextResponse.json({ error: "Requested page is too large." }, { status: 400 });
    }
    if (search && search.length > 120) {
      return NextResponse.json(
        { error: "Search text must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    const where: Prisma.BtebNoticeWhereInput = search
      ? { title: { contains: search, mode: "insensitive" } }
      : {};

    try {
      const [notices, total] = await prisma.$transaction([
        prisma.btebNotice.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ publishDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            publishDate: true,
            fileUrl: true,
            isImportant: true,
            isResultPdf: true,
          },
        }),
        prisma.btebNotice.count({ where }),
      ]);

      return NextResponse.json({
        notices,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error("Failed to fetch BTEB notices:", error);
      return NextResponse.json({ error: "Unable to load notices right now." }, { status: 500 });
    }
  }

  if (type === "result") {
    const roll = searchParams.get("roll")?.trim();
    if (!roll || !/^\d{6}$/.test(roll)) {
      return NextResponse.json(
        { error: "Roll number must contain exactly 6 digits." },
        { status: 400 },
      );
    }

    try {
      const results = await prisma.examResult.findMany({
        where: { roll },
        orderBy: [
          { notice: { publishDate: { sort: "desc", nulls: "last" } } },
          { createdAt: "desc" },
        ],
        select: {
          roll: true,
          gpa: true,
          passed: true,
          failedSubjects: true,
          notice: {
            select: {
              title: true,
              publishDate: true,
            },
          },
        },
      });

      return NextResponse.json({
        roll,
        found: results.length > 0,
        status:
          results.length === 0
            ? "NOT_FOUND"
            : results.some((result) => !result.passed)
              ? "REFERRED"
              : "PASSED",
        results,
      });
    } catch (error) {
      console.error("Failed to fetch BTEB roll result:", error);
      return NextResponse.json({ error: "Unable to search results right now." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Specify type=notices or type=result." },
    { status: 400 },
  );
}
