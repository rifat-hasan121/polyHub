import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.passwordHash || !(await compare(password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          department: user.department,
          semester: user.semester,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: {
          name: user.name ?? user.email,
          image: user.image,
        },
        create: {
          email: user.email.toLowerCase(),
          name: user.name ?? user.email,
          image: user.image,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: {
            id: true,
            role: true,
            department: true,
            semester: true,
          },
        });

        if (!dbUser) {
          throw new Error("Authenticated user was not found in the database.");
        }

        token.id = dbUser.id;
        token.role = dbUser.role;
        token.department = dbUser.department;
        token.semester = dbUser.semester;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.semester = token.semester;
      }

      return session;
    },
  },
};
