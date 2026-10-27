import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    department?: string | null;
    semester?: number | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      semester?: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    department: string | null;
    semester: number | null;
  }
}
