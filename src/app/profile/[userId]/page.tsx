import type { Metadata } from "next";
import { UserProfilePage } from "@/components/profile/user-profile-page";

type PageProps = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  return {
    title: "Student Profile",
    alternates: { canonical: `/profile/${encodeURIComponent(userId)}` },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params;
  return <UserProfilePage userId={userId} />;
}
