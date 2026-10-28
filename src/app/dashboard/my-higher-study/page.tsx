import type { Metadata } from "next";
import { HigherStudyFeed } from "@/components/higher-study/higher-study-feed";

export const metadata: Metadata = {
  title: "Higher-Study Community",
  description: "Explore higher-study resources shared by the PolyHub community.",
};

export default function MyHigherStudyPage() {
  return (
    <HigherStudyFeed />
  );
}
