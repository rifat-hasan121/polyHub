import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolyHub | Bangladesh Polytechnic Platform",
  description:
    "A connected platform for Bangladesh polytechnic students to learn, collaborate, and grow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AuthSessionProvider>
          <AppShell>{children}</AppShell>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
