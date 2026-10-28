"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type ReactionType = "LIKE" | "DISLIKE";
type Status = "PENDING" | "APPROVED" | "REJECTED";
type Category = "DUET_NON_DEPT" | "DUET_DEPT" | "PRIVATE_UNI" | "ABROAD_STUDY";

type Author = {
  id: string | null;
  name: string;
  image: string | null;
  polytechnic: string | null;
};

type Resource = {
  id: string;
  title: string;
  description: string;
  category: Category;
  department: string | null;
  subject: string | null;
  year: number | null;
  fileUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  status: Status;
  author: Author;
  likes: number;
  dislikes: number;
  comments: number;
  viewerReaction: ReactionType | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};

const categories: { value: Category; label: string }[] = [
  { value: "DUET_NON_DEPT", label: "DUET Non-Department" },
  { value: "DUET_DEPT", label: "DUET Department-wise" },
  { value: "PRIVATE_UNI", label: "Private University" },
  { value: "ABROAD_STUDY", label: "Study Abroad" },
];

const categoryLabels = Object.fromEntries(categories.map(({ value, label }) => [value, label])) as Record<Category, string>;

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function AuthorProfile({ author, date }: { author: Author; date: string }) {
  const initials = author.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const contents = (
    <div className="flex min-w-0 items-center gap-3">
      {author.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="size-10 rounded-full object-cover" height={40} src={author.image} width={40} />
      ) : (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-900">
          {initials || "P"}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{author.name}</span>
        <span className="block truncate text-xs text-slate-500">
          {[author.polytechnic, new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(date))]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </div>
  );
  return author.id ? (
    <Link aria-label={`View ${author.name}'s profile`} className="min-w-0 rounded-lg hover:opacity-80" href={`/profile/${encodeURIComponent(author.id)}`}>
      {contents}
    </Link>
  ) : contents;
}

function StatusBadge({ status }: { status: Status }) {
  const style = status === "APPROVED"
    ? "bg-emerald-50 text-emerald-800"
    : status === "REJECTED"
      ? "bg-red-50 text-red-800"
      : "bg-amber-50 text-amber-800";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status === "APPROVED" ? <CheckCircle aria-hidden="true" className="size-3.5" /> : null}
      {status === "REJECTED" ? <AlertCircle aria-hidden="true" className="size-3.5" /> : null}
      {status === "PENDING" ? <Clock aria-hidden="true" className="size-3.5" /> : null}
      {status === "PENDING" ? "Pending review" : status === "APPROVED" ? "Approved" : "Rejected"}
    </span>
  );
}

export function HigherStudyFeed() {
  const { data: session, status: sessionStatus } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [activeCommentId, setActiveCommentId] = useState("");
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [pendingActionId, setPendingActionId] = useState("");
  const isSignedIn = sessionStatus === "authenticated" && Boolean(session?.user?.id);

  async function loadFeed() {
    setError("");
    try {
      const response = await fetch("/api/higher-study/feed", { cache: "no-store" });
      const result = (await response.json()) as { resources?: Resource[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load higher-study posts.");
      setResources(result.resources ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load higher-study posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/higher-study/feed", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { resources?: Resource[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load higher-study posts.");
        return result.resources ?? [];
      })
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load higher-study posts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const yearText = String(formData.get("year") ?? "").trim();
    const year = yearText ? Number(yearText) : null;
    if (yearText && (year === null || !Number.isInteger(year) || year < 1900 || year > 2100)) {
      setError("Enter a year between 1900 and 2100.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/higher-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          category: formData.get("category"),
          department: String(formData.get("department") ?? "").trim() || null,
          subject: String(formData.get("subject") ?? "").trim() || null,
          description: String(formData.get("description") ?? "").trim(),
          fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
          videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
          year,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to submit your post.");
      form.reset();
      setFormOpen(false);
      await loadFeed();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit your post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function reactToPost(resource: Resource, type: ReactionType) {
    if (!isSignedIn) return;
    setPendingActionId(resource.id);
    setError("");
    try {
      const response = await fetch(`/api/higher-study/${encodeURIComponent(resource.id)}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const result = (await response.json()) as { reaction?: ReactionType; error?: string };
      if (!response.ok || !result.reaction) throw new Error(result.error ?? "Unable to save your reaction.");
      await loadFeed();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your reaction.");
    } finally {
      setPendingActionId("");
    }
  }

  async function deletePost(resource: Resource) {
    if (!window.confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
    setDeletingId(resource.id);
    setError("");
    try {
      const response = await fetch(`/api/higher-study/${encodeURIComponent(resource.id)}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete your post.");
      setResources((current) => current.filter((item) => item.id !== resource.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete your post.");
    } finally {
      setDeletingId("");
    }
  }

  async function openComments(resourceId: string) {
    if (activeCommentId === resourceId) {
      setActiveCommentId("");
      return;
    }
    setActiveCommentId(resourceId);
    if (comments[resourceId]) return;
    try {
      const response = await fetch(`/api/higher-study/${encodeURIComponent(resourceId)}/comments`, { cache: "no-store" });
      const result = (await response.json()) as { comments?: Comment[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load comments.");
      setComments((current) => ({ ...current, [resourceId]: result.comments ?? [] }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load comments.");
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>, resourceId: string) {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    setSendingComment(true);
    setError("");
    try {
      const response = await fetch(`/api/higher-study/${encodeURIComponent(resourceId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft }),
      });
      const result = (await response.json()) as { comment?: Comment; error?: string };
      if (!response.ok || !result.comment) throw new Error(result.error ?? "Unable to publish your comment.");
      setComments((current) => ({
        ...current,
        [resourceId]: [...(current[resourceId] ?? []), result.comment!],
      }));
      setResources((current) => current.map((resource) => resource.id === resourceId
        ? { ...resource, comments: resource.comments + 1 }
        : resource));
      setCommentDraft("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish your comment.");
    } finally {
      setSendingComment(false);
    }
  }

  const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10";

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Community resources</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Higher-Study Posts</h1>
          <p className="mt-2 text-sm text-slate-600">Explore resources shared by students and alumni.</p>
        </div>
        {isSignedIn ? (
          <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800" onClick={() => setFormOpen((open) => !open)} type="button">
            <Plus aria-hidden="true" className="size-4" /> Create a post
          </button>
        ) : (
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800" href="/login?callbackUrl=%2Fdashboard%2Fmy-higher-study">
            <Plus aria-hidden="true" className="size-4" /> Sign in to create a post
          </Link>
        )}
      </header>

      {formOpen && isSignedIn ? (
        <form className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => void createPost(event)}>
          <h2 className="text-lg font-semibold text-slate-950">Share a higher-study resource</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-title">Title
              <input className={`mt-1.5 ${inputClass}`} id="feed-title" maxLength={200} minLength={3} name="title" required />
            </label>
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-category">Category
              <select className={`mt-1.5 ${inputClass}`} defaultValue="DUET_NON_DEPT" id="feed-category" name="category">
                {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-department">Department
              <input className={`mt-1.5 ${inputClass}`} id="feed-department" maxLength={80} name="department" placeholder="CST, EEE, CE..." />
            </label>
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-subject">Subject
              <input className={`mt-1.5 ${inputClass}`} id="feed-subject" maxLength={120} name="subject" />
            </label>
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-year">Year
              <input className={`mt-1.5 ${inputClass}`} id="feed-year" max={2100} min={1900} name="year" type="number" />
            </label>
            <label className="text-sm font-medium text-slate-700" htmlFor="feed-file">Resource URL
              <input className={`mt-1.5 ${inputClass}`} id="feed-file" name="fileUrl" type="url" />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2" htmlFor="feed-video">Video URL
              <input className={`mt-1.5 ${inputClass}`} id="feed-video" name="videoUrl" type="url" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="feed-description">Description
            <textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" id="feed-description" maxLength={5000} name="description" />
          </label>
          <p className="text-xs text-slate-500">New posts are visible to everyone after moderator approval.</p>
          <div className="flex justify-end gap-2">
            <button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={() => setFormOpen(false)} type="button">Cancel</button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">
              {submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
              Submit for review
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p> : null}
      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500" role="status">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Loading posts...
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <GraduationCap aria-hidden="true" className="mx-auto size-9 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">No higher-study posts yet</h2>
          <p className="mt-2 text-sm text-slate-500">Approved community posts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => {
            const fileUrl = safeUrl(resource.fileUrl);
            const videoUrl = safeUrl(resource.videoUrl);
            const isUnapprovedPost = resource.status !== "APPROVED";
            return (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" key={resource.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <AuthorProfile author={resource.author} date={resource.createdAt} />
                  <div className="flex items-center gap-2">
                    {isUnapprovedPost ? <StatusBadge status={resource.status} /> : null}
                    {isSignedIn && resource.author.id === session?.user?.id ? (
                      <button aria-label={`Delete ${resource.title}`} className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60" disabled={deletingId === resource.id} onClick={() => void deletePost(resource)} type="button">
                        {deletingId === resource.id ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">{categoryLabels[resource.category]}</span>
                  {resource.subject ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{resource.subject}</span> : null}
                  {resource.department ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{resource.department}</span> : null}
                  {resource.year ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{resource.year}</span> : null}
                </div>
                <h2 className="mt-3 text-xl font-bold text-slate-950">{resource.title}</h2>
                {resource.description ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{resource.description}</p> : null}
                {fileUrl || videoUrl ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {fileUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={fileUrl} rel="noreferrer" target="_blank"><FileText aria-hidden="true" className="size-4" /> Resource <ArrowUpRight aria-hidden="true" className="size-3.5" /></a> : null}
                    {videoUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={videoUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" className="size-4" /> Video <ArrowUpRight aria-hidden="true" className="size-3.5" /></a> : null}
                  </div>
                ) : null}
                {!isUnapprovedPost ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {isSignedIn ? (
                        <>
                          <button aria-pressed={resource.viewerReaction === "LIKE"} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${resource.viewerReaction === "LIKE" ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`} disabled={pendingActionId === resource.id} onClick={() => void reactToPost(resource, "LIKE")} type="button">
                            <ThumbsUp aria-hidden="true" className="size-4" /> Like {resource.likes}
                          </button>
                          <button aria-pressed={resource.viewerReaction === "DISLIKE"} className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${resource.viewerReaction === "DISLIKE" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`} disabled={pendingActionId === resource.id} onClick={() => void reactToPost(resource, "DISLIKE")} type="button">
                            <ThumbsDown aria-hidden="true" className="size-4" /> Dislike {resource.dislikes}
                          </button>
                        </>
                      ) : (
                        <>
                          <Link className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50" href="/login?callbackUrl=%2Fdashboard%2Fmy-higher-study"><ThumbsUp aria-hidden="true" className="size-4" /> Sign in to like · {resource.likes}</Link>
                          <Link className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50" href="/login?callbackUrl=%2Fdashboard%2Fmy-higher-study"><ThumbsDown aria-hidden="true" className="size-4" /> Sign in to dislike · {resource.dislikes}</Link>
                        </>
                      )}
                      <button aria-expanded={activeCommentId === resource.id} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void openComments(resource.id)} type="button">
                        <MessageCircle aria-hidden="true" className="size-4" /> Comments {resource.comments}
                      </button>
                    </div>
                    {activeCommentId === resource.id ? (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <div className="space-y-3">
                          {(comments[resource.id] ?? []).map((comment) => (
                            <div className="flex gap-3" key={comment.id}>
                              <AuthorProfile author={comment.author} date={comment.createdAt} />
                              <p className="min-w-0 flex-1 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{comment.content}</p>
                            </div>
                          ))}
                          {comments[resource.id]?.length === 0 ? <p className="text-sm text-slate-500">No comments yet.</p> : null}
                        </div>
                        {isSignedIn ? (
                          <form className="mt-4 flex gap-2" onSubmit={(event) => void addComment(event, resource.id)}>
                            <input aria-label="Write a comment" className={inputClass} maxLength={2000} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Write a comment..." value={commentDraft} />
                            <button aria-label="Send comment" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-cyan-700 text-white disabled:opacity-60" disabled={sendingComment || !commentDraft.trim()} type="submit">
                              {sendingComment ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
                            </button>
                          </form>
                        ) : (
                          <Link className="mt-4 inline-flex text-sm font-semibold text-cyan-800 hover:underline" href="/login?callbackUrl=%2Fdashboard%2Fmy-higher-study">Sign in to comment</Link>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
