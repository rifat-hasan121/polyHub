import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { higherStudyResourceSchema } from "@/lib/higher-study-validation";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const resources = await prisma.higherStudyResource.findMany({
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Failed to load admin higher-study resources:", error);
    return NextResponse.json({ error: "Unable to load higher-study resources." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = higherStudyResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the resource details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const resource = await prisma.higherStudyResource.create({
      data: {
        ...parsed.data,
        isVerified: true,
        status: "APPROVED",
      },
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Failed to create higher-study resource:", error);
    return NextResponse.json({ error: "Unable to create the resource." }, { status: 500 });
  }
}
