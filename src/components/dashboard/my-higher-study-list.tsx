"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type ResourceStatus = "PENDING" | "APPROVED" | "REJECTED";
type HigherStudyCategory = "DUET_NON_DEPT" | "DUET_DEPT" | "PRIVATE_UNI" | "ABROAD_STUDY";

type Resource = {
  id: string;
  title: string;
  category: HigherStudyCategory;
  department: string | null;
  subject: string | null;
  description: string;
  fileUrl: string | null;
  videoUrl: string | null;
  year: number | null;
  status: ResourceStatus;
  rejectionReason: string | null;
  createdAt: string;
};

const categoryLabels: Record<HigherStudyCategory, string> = {
  DUET_NON_DEPT: "DUET Non-Department",
  DUET_DEPT: "DUET Department-wise",
  PRIVATE_UNI: "Private University",
  ABROAD_STUDY: "Study Abroad",
};

function StatusBadge({ status }: { status: ResourceStatus }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
        <CheckCircle aria-hidden="true" className="size-4" /> Approved
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
        <AlertCircle aria-hidden="true" className="size-4" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
      <Clock aria-hidden="true" className="size-4" /> Pending review
    </span>
  );
}

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function MyHigherStudyList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadResources = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/higher-study/mine", { cache: "no-store" });
      const result = (await response.json()) as { resources?: Resource[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load your higher-study posts.");
      setResources(result.resources ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load your higher-study posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/higher-study/mine", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { resources?: Resource[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load your higher-study posts.");
        return result.resources ?? [];
      })
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your higher-study posts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const yearText = String(formData.get("year") ?? "").trim();
    const year = yearText ? Number(yearText) : null;
    if (yearText && (!Number.isInteger(year) || year! < 1900 || year! > 2100)) {
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
      setSuccess("Your post was submitted for moderator review.");
      await loadResources();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit your post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
    setError("");
    setDeletingId(resource.id);
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

  const inputClass =
    "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10";

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Your contributions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My Higher-Study Posts</h1>
        <p className="mt-2 text-sm text-slate-600">
          Share a resource and follow its status while moderators review it.
        </p>
      </header>

      <form className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={(event) => void submitResource(event)}>
        <div className="flex items-center gap-2">
          <Plus aria-hidden="true" className="size-5 text-cyan-700" />
          <h2 className="text-lg font-semibold text-slate-950">Share a higher-study resource</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-title">
            Title
            <input className={inputClass} id="higher-study-title" maxLength={200} minLength={3} name="title" required />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-category">
            Category
            <select className={inputClass} defaultValue="DUET_NON_DEPT" id="higher-study-category" name="category">
              <option value="DUET_NON_DEPT">DUET Non-Department</option>
              <option value="DUET_DEPT">DUET Department-wise</option>
              <option value="PRIVATE_UNI">Private University</option>
              <option value="ABROAD_STUDY">Study Abroad</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-department">
            Department
            <input className={inputClass} id="higher-study-department" maxLength={80} name="department" placeholder="CST, EEE, CE..." />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-subject">
            Subject
            <input className={inputClass} id="higher-study-subject" maxLength={120} name="subject" />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-year">
            Exam year
            <input className={inputClass} id="higher-study-year" max={2100} min={1900} name="year" type="number" />
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-file">
            File or resource URL
            <input className={inputClass} id="higher-study-file" name="fileUrl" type="url" />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2" htmlFor="higher-study-video">
            Video URL
            <input className={inputClass} id="higher-study-video" name="videoUrl" type="url" />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="higher-study-description">
          Description
          <textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" id="higher-study-description" maxLength={5000} name="description" />
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
        {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{success}</p> : null}
        <div className="flex justify-end">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
            Submit for review
          </button>
        </div>
      </form>

      <h2 className="mb-3 text-xl font-bold text-slate-950">Your submissions</h2>
      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500" role="status">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Loading your posts...
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">You have not shared any higher-study posts yet.</p>
          <p className="mt-2 text-sm text-slate-500">Your submitted resources and review statuses will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => {
            const fileUrl = safeUrl(resource.fileUrl);
            const videoUrl = safeUrl(resource.videoUrl);
            return (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={resource.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={resource.status} />
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {categoryLabels[resource.category]}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">{resource.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {[resource.subject, resource.department, resource.year].filter(Boolean).join(" · ") || "No subject details"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Submitted {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(resource.createdAt))}
                    </p>
                    {resource.status === "REJECTED" && resource.rejectionReason ? (
                      <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <span className="font-semibold">Reason: </span>{resource.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {fileUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={fileUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" className="size-3.5" /> Resource</a> : null}
                    {videoUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={videoUrl} rel="noreferrer" target="_blank"><ExternalLink aria-hidden="true" className="size-3.5" /> Video</a> : null}
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" disabled={deletingId === resource.id} onClick={() => void deleteResource(resource)} type="button">
                      {deletingId === resource.id ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Trash2 aria-hidden="true" className="size-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
