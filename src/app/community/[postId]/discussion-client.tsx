"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";

type Author = {
  id: string;
  name: string | null;
  image: string | null;
  polytechnic: string | null;
};

type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  department: string;
  createdAt: string;
  user: Author;
  _count: { comments: number };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
};

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function AuthorAvatar({ author }: { author: Author }) {
  if (author.image) {
    return (
      <span
        aria-label={author.name ?? "Student"}
        className="size-11 shrink-0 rounded-full bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url("${author.image}")` }}
      />
    );
  }
  const initials = (author.name ?? "Student")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">
      {initials}
    </span>
  );
}

export default function CommunityDiscussion({ postId }: { postId: string }) {
  const { status } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDiscussion = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [postResponse, commentsResponse] = await Promise.all([
        fetch(`/api/community/${postId}`),
        fetch(`/api/community/${postId}/comments`),
      ]);
      const postResult = (await postResponse.json()) as { post?: Post; error?: string };
      const commentsResult = (await commentsResponse.json()) as {
        comments?: Comment[];
        error?: string;
      };
      if (!postResponse.ok) throw new Error(postResult.error ?? "Unable to load discussion.");
      if (!commentsResponse.ok) {
        throw new Error(commentsResult.error ?? "Unable to load replies.");
      }
      setPost(postResult.post ?? null);
      setComments(commentsResult.comments ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load discussion.");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDiscussion(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDiscussion]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formData.get("content") }),
      });
      const result = (await response.json()) as {
        comment?: Comment;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to publish reply.");
      if (result.comment) {
        setComments((current) => [...current, result.comment!]);
        setPost((current) =>
          current
            ? {
                ...current,
                _count: { comments: current._count.comments + 1 },
              }
            : current,
        );
      }
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish reply.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-72 rounded-2xl bg-white" />
        <div className="h-40 rounded-2xl bg-white" />
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </p>
        <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800" href="/community">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to community
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-cyan-800"
        href="/community"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All discussions
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <AuthorAvatar author={post.user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {post.user.name ?? "PolyHub student"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {post.user.polytechnic ?? "Polytechnic student"} · {relativeTime(post.createdAt)}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
            {post.department}
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
          {post.content}
        </p>
        {post.imageUrl ? (
          <div className="relative mt-6 h-[min(34rem,70vh)] w-full overflow-hidden rounded-xl border border-slate-200">
            <Image
              alt="Attachment shared in the discussion"
              className="object-contain"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              src={post.imageUrl}
              unoptimized
            />
          </div>
        ) : null}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <MessageCircle aria-hidden="true" className="size-4" />
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </div>
      </article>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">Join the discussion</h2>
        {status === "authenticated" ? (
          <form className="mt-4" onSubmit={submitComment}>
            <label className="sr-only" htmlFor="reply-content">Your reply</label>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="reply-content"
              maxLength={5000}
              minLength={1}
              name="content"
              placeholder="Share an answer or helpful explanation..."
              required
            />
            <div className="mt-3 flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                <Send aria-hidden="true" className="size-4" />
                {isSubmitting ? "Replying..." : "Reply"}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <Link className="font-semibold text-cyan-800 hover:text-cyan-950" href="/login">
              Sign in
            </Link>{" "}
            to add a reply.
          </p>
        )}
      </section>

      <section aria-label="Replies" className="mt-6 space-y-3">
        {comments.map((comment) => (
          <article className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" key={comment.id}>
            <AuthorAvatar author={comment.user} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  {comment.user.name ?? "PolyHub student"}
                </p>
                <p className="text-xs text-slate-500">
                  {comment.user.polytechnic ?? "Polytechnic student"}
                </p>
                <time className="ml-auto text-xs text-slate-400" dateTime={comment.createdAt}>
                  {relativeTime(comment.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {comment.content}
              </p>
            </div>
          </article>
        ))}
        {comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No replies yet. Be the first to help.
          </p>
        ) : null}
      </section>
    </div>
  );
}
