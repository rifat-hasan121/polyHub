import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { higherStudyResourceUpdateSchema } from "@/lib/higher-study-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  return updateResource(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateResource(request, context);
}

async function updateResource(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = higherStudyResourceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the resource details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const resource = await prisma.higherStudyResource.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ resource });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Higher-study resource was not found." }, { status: 404 });
    }
    console.error("Failed to update higher-study resource:", error);
    return NextResponse.json({ error: "Unable to update the resource." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  try {
    await prisma.higherStudyResource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Higher-study resource was not found." }, { status: 404 });
    }
    console.error("Failed to delete higher-study resource:", error);
    return NextResponse.json({ error: "Unable to delete the resource." }, { status: 500 });
  }
}
