import type { Probidhan, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    department?: string | null;
    semester?: number | null;
    polytechnic?: string | null;
    probidhan?: Probidhan | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      semester?: number | null;
      polytechnic?: string | null;
      probidhan?: Probidhan | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    department: string | null;
    semester: number | null;
    polytechnic: string | null;
    probidhan: Probidhan | null;
  }
}
