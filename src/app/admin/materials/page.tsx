import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MaterialModerationQueue } from "@/components/admin/material-moderation-queue";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Material Moderation Queue",
  robots: { index: false, follow: false },
};

async function ModerationQueueContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Fmaterials");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return <MaterialModerationQueue />;
}

export default function MaterialsModerationPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <ModerationQueueContent />
    </Suspense>
  );
}
