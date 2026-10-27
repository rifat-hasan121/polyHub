import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moderationSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED") }),
  z.object({
    status: z.literal("REJECTED"),
    rejectionReason: z.string().trim().min(1).max(1000),
  }),
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to review materials." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose an approval decision and provide a rejection reason when rejecting.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const result = await prisma.material.updateMany({
      where: { id, status: "PENDING" },
      data: parsed.data.status === "APPROVED"
        ? { status: "APPROVED", rejectionReason: null }
        : { status: "REJECTED", rejectionReason: parsed.data.rejectionReason },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Pending material was not found or already reviewed." }, { status: 404 });
    }
    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    console.error("Failed to moderate material:", error);
    return NextResponse.json({ error: "Unable to update material status." }, { status: 500 });
  }
}
