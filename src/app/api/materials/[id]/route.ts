import { MaterialType, Probidhan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  fileUrl: z.string().trim().url().max(2048).refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  }, "File URL must use http or https."),
  type: z.enum(Object.values(MaterialType)),
  probidhan: z.enum(Object.values(Probidhan)),
  subjectId: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(2100).nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to edit your material." }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the material details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const subject = await prisma.subject.findUnique({
      where: { id: parsed.data.subjectId },
      select: { id: true, probidhan: true },
    });
    if (!subject || subject.probidhan !== parsed.data.probidhan) {
      return NextResponse.json({ error: "Select a valid subject for this Probidhan." }, { status: 400 });
    }

    const result = await prisma.material.updateMany({
      where: { id, userId: session.user.id, status: "PENDING" },
      data: {
        title: parsed.data.title,
        fileUrl: parsed.data.fileUrl,
        type: parsed.data.type,
        probidhan: parsed.data.probidhan,
        subjectId: subject.id,
        year: parsed.data.year,
      },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Pending material was not found or can no longer be edited." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user's material:", error);
    return NextResponse.json({ error: "Unable to update your material." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete your material." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const result = await prisma.material.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Your material was not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user's material:", error);
    return NextResponse.json({ error: "Unable to delete your material." }, { status: 500 });
  }
}
