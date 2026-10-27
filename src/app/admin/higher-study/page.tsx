import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HigherStudyTable } from "@/components/admin/higher-study-table";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Higher Study Resource Management",
  robots: { index: false, follow: false },
};

async function HigherStudyAdminContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fhigher-study");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <HigherStudyTable />;
}

export default function HigherStudyAdminPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <HigherStudyAdminContent />
    </Suspense>
  );
}
