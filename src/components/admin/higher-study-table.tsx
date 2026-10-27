"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HigherStudyCategory } from "@prisma/client";
import {
  ArrowUpRight,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
  isVerified: boolean;
  createdAt: string;
};

const httpUrl = z.string().trim().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Enter an http or https URL.");

const resourceFormSchema = z.object({
  title: z.string().trim().min(3, "Title must have at least 3 characters.").max(200),
  category: z.enum(HigherStudyCategory),
  department: z.string().trim().max(80).transform((value) => value || null),
  subject: z.string().trim().max(120).transform((value) => value || null),
  description: z.string().trim().max(5000).transform((value) => value || null),
  fileUrl: z.union([z.literal(""), httpUrl]).transform((value) => value || null),
  videoUrl: z.union([z.literal(""), httpUrl]).transform((value) => value || null),
  year: z.union([z.literal(""), z.string().regex(/^\d{4}$/, "Enter a four-digit year.")])
    .transform((value) => value === "" ? null : Number(value))
    .refine((value) => value === null || (value >= 1900 && value <= 2100), "Enter a year from 1900 to 2100."),
});

type ResourceFormInput = z.input<typeof resourceFormSchema>;
type ResourceFormOutput = z.output<typeof resourceFormSchema>;

const categories: { value: HigherStudyCategory; label: string }[] = [
  { value: "DUET_NON_DEPT", label: "DUET Non-Department" },
  { value: "DUET_DEPT", label: "DUET Department-wise" },
  { value: "PRIVATE_UNI", label: "Private University" },
  { value: "ABROAD_STUDY", label: "Study Abroad" },
];

const departments = [
  { code: "CST", label: "Computer Science & Technology (CST)" },
  { code: "CE", label: "Civil (CE)" },
  { code: "EEE", label: "Electrical & Electronic Engineering (EEE)" },
  { code: "ME", label: "Mechanical (ME)" },
  { code: "POWER", label: "Power" },
  { code: "ET", label: "Electronics (ET)" },
  { code: "RAC", label: "Refrigeration & Air Conditioning (RAC)" },
];

const categoryLabels: Record<HigherStudyCategory, string> = {
  DUET_NON_DEPT: "DUET Non-Department",
  DUET_DEPT: "DUET Department-wise",
  PRIVATE_UNI: "Private University",
  ABROAD_STUDY: "Study Abroad",
};

function isSafeUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function ResourceForm({
  resource,
  onClose,
  onSaved,
}: {
  resource: Resource | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResourceFormInput, unknown, ResourceFormOutput>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: resource?.title ?? "",
      category: resource?.category ?? "DUET_NON_DEPT",
      department: resource?.department ?? "",
      subject: resource?.subject ?? "",
      description: resource?.description ?? "",
      fileUrl: resource?.fileUrl ?? "",
      videoUrl: resource?.videoUrl ?? "",
      year: resource?.year?.toString() ?? "",
    },
  });
  const selectedCategory = useWatch({ control, name: "category" });

  async function save(values: ResourceFormOutput) {
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        resource ? `/api/admin/higher-study/${encodeURIComponent(resource.id)}` : "/api/admin/higher-study",
        {
          method: resource ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save the resource.");
      await onSaved();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save the resource.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <div
      aria-labelledby="higher-study-form-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      role="dialog"
    >
      <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id="higher-study-form-title">
              {resource ? "Edit resource" : "Add new resource"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Add study materials, document links, or lecture videos.</p>
          </div>
          <button
            aria-label="Close resource form"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit(save)}>
          <label className={labelClass} htmlFor="resource-title">
            Title
            <input
              {...register("title")}
              className={inputClass}
              id="resource-title"
              maxLength={200}
              placeholder="DUET admission mathematics notes"
            />
            {errors.title?.message ? <span className="mt-1 block text-xs text-red-700">{errors.title.message}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass} htmlFor="resource-category">
              Category
              <select {...register("category")} className={inputClass} id="resource-category">
                {categories.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            {selectedCategory === "DUET_DEPT" ? (
              <label className={labelClass} htmlFor="resource-department">
                Department
                <select {...register("department")} className={inputClass} id="resource-department">
                  <option value="">Select department</option>
                  {departments.map(({ code, label }) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass} htmlFor="resource-subject">
              Subject
              <input
                {...register("subject")}
                className={inputClass}
                id="resource-subject"
                maxLength={120}
                placeholder="Physics 1st Paper, Data Structures"
              />
              {errors.subject?.message ? <span className="mt-1 block text-xs text-red-700">{errors.subject.message}</span> : null}
            </label>
            <label className={labelClass} htmlFor="resource-year">
              Exam year
              <input
                {...register("year")}
                className={inputClass}
                id="resource-year"
                inputMode="numeric"
                max="2100"
                min="1900"
                placeholder="2023"
                type="number"
              />
              {errors.year?.message ? <span className="mt-1 block text-xs text-red-700">{errors.year.message}</span> : null}
            </label>
          </div>

          <label className={labelClass} htmlFor="resource-file-url">
            PDF file link / URL
            <input
              {...register("fileUrl")}
              className={inputClass}
              id="resource-file-url"
              placeholder="https://drive.google.com/..."
              type="url"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Paste a shareable Google Drive, S3, or UploadThing link.
            </span>
            {errors.fileUrl?.message ? <span className="mt-1 block text-xs text-red-700">{errors.fileUrl.message}</span> : null}
          </label>

          <label className={labelClass} htmlFor="resource-video-url">
            Lecture video URL
            <input
              {...register("videoUrl")}
              className={inputClass}
              id="resource-video-url"
              placeholder="https://youtube.com/..."
              type="url"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">Paste a YouTube or shareable Drive link.</span>
            {errors.videoUrl?.message ? <span className="mt-1 block text-xs text-red-700">{errors.videoUrl.message}</span> : null}
          </label>

          <label className={labelClass} htmlFor="resource-description">
            Description / notes
            <textarea
              {...register("description")}
              className="mt-1.5 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="resource-description"
              maxLength={5000}
              placeholder="Add helpful context for students."
            />
            {errors.description?.message ? <span className="mt-1 block text-xs text-red-700">{errors.description.message}</span> : null}
          </label>

          {saveError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{saveError}</p> : null}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
              {resource ? "Save changes" : "Create resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HigherStudyTable() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formResource, setFormResource] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadResources = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/higher-study", { cache: "no-store" });
      const result = (await response.json()) as { resources?: Resource[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load resources.");
      setResources(result.resources ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load resources.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/higher-study", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { resources?: Resource[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load resources.");
        return result.resources ?? [];
      })
      .then((items) => {
        if (active) setResources(items);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Unable to load resources.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function openCreateForm() {
    setFormResource(null);
    setFormOpen(true);
  }

  function openEditForm(resource: Resource) {
    setFormResource(resource);
    setFormOpen(true);
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`Delete "${resource.title}"? This action cannot be undone.`)) return;
    setDeletingId(resource.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/higher-study/${encodeURIComponent(resource.id)}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete the resource.");
      setResources((current) => current.filter((item) => item.id !== resource.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete the resource.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Admin tools</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Higher Study Resources</h1>
          <p className="mt-2 text-sm text-slate-600">Manage DUET admission materials, question papers, and university guides.</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
          onClick={openCreateForm}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add New Resource
        </button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500" role="status">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Loading resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText aria-hidden="true" className="mx-auto size-9 text-slate-400" />
            <h2 className="mt-3 font-semibold text-slate-900">No resources yet</h2>
            <p className="mt-1 text-sm text-slate-500">Add a resource to publish it in the Higher Study Corner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Year</th>
                  <th className="px-5 py-3 font-semibold">Links</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((resource) => (
                  <tr className="align-top" key={resource.id}>
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-slate-900">{resource.title}</p>
                      {resource.subject ? <p className="mt-1 text-xs text-slate-500">{resource.subject}</p> : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                        {categoryLabels[resource.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{resource.department || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{resource.year ?? "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {isSafeUrl(resource.fileUrl) ? (
                          <a
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            href={resource.fileUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <FileText aria-hidden="true" className="size-3.5" /> PDF <ArrowUpRight aria-hidden="true" className="size-3" />
                          </a>
                        ) : null}
                        {isSafeUrl(resource.videoUrl) ? (
                          <a
                            className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                            href={resource.videoUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Video aria-hidden="true" className="size-3.5" /> Video <ArrowUpRight aria-hidden="true" className="size-3" />
                          </a>
                        ) : null}
                        {!isSafeUrl(resource.fileUrl) && !isSafeUrl(resource.videoUrl) ? (
                          <span className="text-xs text-slate-400">No links</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${resource.title}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => openEditForm(resource)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" /> Edit
                        </button>
                        <button
                          aria-label={`Delete ${resource.title}`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          disabled={deletingId === resource.id}
                          onClick={() => void deleteResource(resource)}
                          type="button"
                        >
                          {deletingId === resource.id ? (
                            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen ? (
        <ResourceForm
          key={formResource?.id ?? "new-resource"}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await loadResources();
          }}
          resource={formResource}
        />
      ) : null}
    </section>
  );
}
