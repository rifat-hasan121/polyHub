import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UserProfilePage } from "@/components/profile/user-profile-page";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default async function DashboardProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fdashboard%2Fprofile");
  }
  return <UserProfilePage userId={session.user.id} />;
}
