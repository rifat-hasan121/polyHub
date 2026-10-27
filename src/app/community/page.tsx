"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageCircle, Plus, Search, X } from "lucide-react";

type Author = {
  id: string;
  name: string | null;
  image: string | null;
  polytechnic: string | null;
};

type CommunityPost = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  department: string;
  createdAt: string;
  user: Author;
  _count: { comments: number };
};

const departmentFilters = [
  { code: "", label: "All discussions" },
  { code: "CST", label: "CST" },
  { code: "CE", label: "Civil" },
  { code: "EEE", label: "Electrical" },
  { code: "ME", label: "Mechanical" },
  { code: "POWER", label: "Power" },
];

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function Avatar({ author }: { author: Author }) {
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

function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-full bg-slate-100" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 h-5 w-3/4 rounded bg-slate-100" />
      <div className="mt-3 h-16 rounded bg-slate-100" />
    </div>
  );
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPosts = useCallback(async (nextPage: number, append = false) => {
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), limit: "10" });
    if (department) params.set("department", department);
    if (search.trim()) params.set("search", search.trim());

    try {
      const response = await fetch(`/api/community?${params}`);
      const result = (await response.json()) as {
        posts?: CommunityPost[];
        hasMore?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to load discussions.");
      setPosts((current) =>
        append ? [...current, ...(result.posts ?? [])] : (result.posts ?? []),
      );
      setHasMore(result.hasMore ?? false);
      setPage(nextPage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load discussions.");
      if (!append) setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [department, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPosts(1), 0);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          content: formData.get("content"),
          department: formData.get("department"),
          imageUrl: formData.get("imageUrl"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to publish discussion.");
      setIsComposerOpen(false);
      await loadPosts(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish discussion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-lg sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Learn together
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Community Forum
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Ask academic questions, share what you know, and help other polytechnic
          students solve doubts.
        </p>
        <button
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-4 font-semibold text-slate-950 transition hover:bg-cyan-300"
          onClick={() => setIsComposerOpen(true)}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5" />
          Ask a Question / Share Doubt
        </button>
      </header>

      <div className="mb-5">
        <label className="relative block">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search discussions"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions and discussions..."
            value={search}
          />
        </label>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {departmentFilters.map((filter) => (
          <button
            aria-pressed={department === filter.code}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              department === filter.code
                ? "border-cyan-700 bg-cyan-700 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
            key={filter.code || "all"}
            onClick={() => setDepartment(filter.code)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">
        {isLoading && posts.length === 0 ? (
          Array.from({ length: 3 }, (_, index) => <PostSkeleton key={index} />)
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <MessageCircle aria-hidden="true" className="mx-auto size-9 text-cyan-700" />
            <h2 className="mt-4 font-semibold text-slate-900">No discussions yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start the conversation by asking the first question.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const expanded = expandedPosts.includes(post.id);
            return (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={post.id}>
                <div className="flex items-center gap-3">
                  <Avatar author={post.user} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {post.user.name ?? "PolyHub student"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {post.user.polytechnic ?? "Polytechnic student"} · {timeAgo(post.createdAt)}
                    </p>
                  </div>
                </div>
                <Link
                  className="mt-4 inline-block text-lg font-bold leading-6 text-slate-950 hover:text-cyan-800"
                  href={`/community/${post.id}`}
                >
                  {post.title}
                </Link>
                <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 ${expanded ? "" : "line-clamp-3"}`}>
                  {post.content}
                </p>
                {post.content.length > 220 ? (
                  <button
                    className="mt-1 text-sm font-semibold text-cyan-800 hover:text-cyan-950"
                    onClick={() =>
                      setExpandedPosts((current) =>
                        expanded
                          ? current.filter((id) => id !== post.id)
                          : [...current, post.id],
                      )
                    }
                    type="button"
                  >
                    {expanded ? "Show less" : "Read more"}
                  </button>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                    {post.department}
                  </span>
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    href={`/community/${post.id}`}
                  >
                    <MessageCircle aria-hidden="true" className="size-3.5" />
                    {post._count.comments} {post._count.comments === 1 ? "reply" : "replies"}
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      {hasMore ? (
        <button
          className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadPosts(page + 1, true)}
          type="button"
        >
          {isLoading ? "Loading..." : "Load more discussions"}
        </button>
      ) : null}

      {isComposerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            aria-labelledby="composer-title"
            aria-modal="true"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950" id="composer-title">
                  Ask the community
                </h2>
                <p className="mt-1 text-sm text-slate-600">Share enough detail so others can help.</p>
              </div>
              <button
                aria-label="Close post form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setIsComposerOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            {status !== "authenticated" || !session?.user ? (
              <div className="rounded-xl bg-slate-50 p-5 text-center">
                <p className="text-sm text-slate-700">Sign in to ask a question or share a doubt.</p>
                <Link className="mt-3 inline-block font-semibold text-cyan-800" href="/login">
                  Go to login
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={createPost}>
                <label className="block text-sm font-medium text-slate-700">
                  Question title
                  <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" maxLength={160} minLength={5} name="title" required />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Details
                  <textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" maxLength={10000} minLength={10} name="content" required />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Department
                    <select className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3" name="department" defaultValue={session.user.department ?? ""}>
                      <option value="">Use my department</option>
                      {departmentFilters.slice(1).map((filter) => (
                        <option key={filter.code} value={filter.code}>{filter.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Image URL (optional)
                    <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3" name="imageUrl" type="url" />
                  </label>
                </div>
                <button className="w-full rounded-lg bg-cyan-700 px-4 py-3 font-semibold text-white hover:bg-cyan-800 disabled:opacity-60" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Publishing..." : "Publish discussion"}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
