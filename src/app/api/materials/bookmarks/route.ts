import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bookmarkSchema = z.object({
  materialId: z.string().min(1).max(100),
  saved: z.boolean(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view saved materials." }, { status: 401 });
  }

  try {
    const savedMaterials = await prisma.savedMaterial.findMany({
      where: { userId: session.user.id },
      select: { materialId: true },
    });
    return NextResponse.json({ materialIds: savedMaterials.map(({ materialId }) => materialId) });
  } catch (error) {
    console.error("Failed to load saved materials:", error);
    return NextResponse.json({ error: "Unable to load saved materials." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save materials." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid material and saved state are required." }, { status: 400 });
  }

  try {
    const materialExists = await prisma.material.findUnique({
      where: { id: parsed.data.materialId },
      select: { id: true },
    });
    if (!materialExists) {
      return NextResponse.json({ error: "Material was not found." }, { status: 404 });
    }

    if (parsed.data.saved) {
      await prisma.savedMaterial.upsert({
        where: {
          userId_materialId: {
            userId: session.user.id,
            materialId: parsed.data.materialId,
          },
        },
        create: {
          userId: session.user.id,
          materialId: parsed.data.materialId,
        },
        update: {},
      });
    } else {
      await prisma.savedMaterial.deleteMany({
        where: {
          userId: session.user.id,
          materialId: parsed.data.materialId,
        },
      });
    }

    return NextResponse.json({ saved: parsed.data.saved });
  } catch (error) {
    console.error("Failed to update saved material:", error);
    return NextResponse.json({ error: "Unable to update saved materials." }, { status: 500 });
  }
}
