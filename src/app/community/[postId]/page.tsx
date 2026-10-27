import { Suspense } from "react";
import CommunityDiscussion from "./discussion-client";

type Props = {
  params: Promise<{ postId: string }>;
};

async function DiscussionPage({ params }: Props) {
  const { postId } = await params;
  return <CommunityDiscussion postId={postId} />;
}

export default function CommunityDiscussionPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-72 rounded-2xl bg-white" />
        </div>
      }
    >
      <DiscussionPage params={params} />
    </Suspense>
  );
}
