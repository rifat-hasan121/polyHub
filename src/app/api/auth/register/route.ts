import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registrationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8)
    .refine((password) => new TextEncoder().encode(password).length <= 72),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a name, valid email, and password with 8-72 bytes." },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hash(parsed.data.password, 12);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });

    return NextResponse.json({ message: "Account created." }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Failed to register user:", error);
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 });
  }
}
