import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MyMaterialsList } from "@/components/dashboard/my-materials-list";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Uploaded Materials",
  robots: { index: false, follow: false },
};

async function MyMaterialsContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard%2Fmy-materials");
  }
  return <MyMaterialsList />;
}

export default function MyMaterialsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <MyMaterialsContent />
    </Suspense>
  );
}
