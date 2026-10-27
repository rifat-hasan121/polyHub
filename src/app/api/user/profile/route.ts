import { Probidhan } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const departments = ["CST", "CE", "EEE", "ME", "POWER", "ET", "RAC"] as const;
const probidhans = Object.values(Probidhan);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  polytechnic: z.string().trim().min(2).max(160),
  department: z.enum(departments),
  probidhan: z.enum(probidhans),
  semester: z.number().int().min(1).max(8),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        polytechnic: true,
        department: true,
        probidhan: true,
        semester: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User profile was not found." }, { status: 404 });
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error("Failed to load user profile:", error);
    return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your profile details.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const profile = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        name: true,
        email: true,
        polytechnic: true,
        department: true,
        probidhan: true,
        semester: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
