import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import {
  higherStudyModerationSchema,
  higherStudyResourceUpdateSchema,
} from "@/lib/higher-study-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  return updateResource(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = higherStudyModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose an approval decision and provide a rejection reason when rejecting.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.higherStudyResource.updateMany({
      where: { id, status: "PENDING" },
      data: parsed.data.status === "APPROVED"
        ? { status: "APPROVED", rejectionReason: null, isVerified: true }
        : { status: "REJECTED", rejectionReason: parsed.data.rejectionReason, isVerified: false },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Pending higher-study submission was not found or already reviewed." }, { status: 404 });
    }
    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    console.error("Failed to moderate higher-study resource:", error);
    return NextResponse.json({ error: "Unable to update higher-study submission status." }, { status: 500 });
  }
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
