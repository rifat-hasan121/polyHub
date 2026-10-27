"use client";

import { MaterialStatus, MaterialType, Probidhan } from "@prisma/client";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Material = {
  id: string;
  title: string;
  fileUrl: string;
  type: MaterialType;
  probidhan: Probidhan;
  status: MaterialStatus;
  rejectionReason: string | null;
  year: number | null;
  subjectId: string;
  createdAt: string;
  subject: {
    name: string;
    code: string;
    semester: number;
    department: { name: string; code: string };
  };
};

type SubjectOption = {
  id: string;
  name: string;
  code: string;
  semester: number;
  department: { name: string; code: string };
};

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
        <CheckCircle aria-hidden="true" className="size-4" /> Approved / Live
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
      <Clock aria-hidden="true" className="size-4" /> Pending Review
    </span>
  );
}

function EditMaterialDialog({
  material,
  onClose,
  onSaved,
}: {
  material: Material;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectId, setSubjectId] = useState(material.subjectId);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSubjects() {
      try {
        const response = await fetch(
          `/api/materials/subjects?probidhan=${material.probidhan}`,
          { signal: controller.signal },
        );
        const result = (await response.json()) as { subjects?: SubjectOption[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load subjects.");
        setSubjects(result.subjects ?? []);
      } catch (caught) {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Unable to load subjects.");
      } finally {
        if (!controller.signal.aborted) setLoadingSubjects(false);
      }
    }
    void loadSubjects();
    return () => controller.abort();
  }, [material.probidhan]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const data = new FormData(event.currentTarget);
    const yearText = String(data.get("year") ?? "").trim();
    const year = yearText ? Number(yearText) : null;
    if (yearText && (!Number.isInteger(year) || year! < 1900 || year! > 2100)) {
      setError("Enter a year between 1900 and 2100.");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch(`/api/materials/${encodeURIComponent(material.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          fileUrl: data.get("fileUrl"),
          type: data.get("type"),
          probidhan: material.probidhan,
          subjectId,
          year,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update material.");
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update material.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10";
  return (
    <div
      aria-labelledby="edit-material-heading"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      role="dialog"
    >
      <form className="my-auto w-full max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onSubmit={(event) => void save(event)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id="edit-material-heading">Edit pending material</h2>
            <p className="mt-1 text-sm text-slate-500">Edits are available until a moderator reviews this submission.</p>
          </div>
          <button aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700" htmlFor="edit-material-title">
          Title
          <input className={inputClass} defaultValue={material.title} id="edit-material-title" maxLength={200} minLength={3} name="title" required />
        </label>
        <label className="block text-sm font-medium text-slate-700" htmlFor="edit-material-file">
          PDF URL
          <input className={inputClass} defaultValue={material.fileUrl} id="edit-material-file" name="fileUrl" required type="url" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="edit-material-type">
            Type
            <select className={inputClass} defaultValue={material.type} id="edit-material-type" name="type">
              <option value="NOTE">Note</option>
              <option value="QUESTION_BANK">Question Bank</option>
              <option value="SYLLABUS">Syllabus</option>
              <option value="BOOK_PDF">Book PDF</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700" htmlFor="edit-material-year">
            Year
            <input className={inputClass} defaultValue={material.year ?? ""} id="edit-material-year" max="2100" min="1900" name="year" type="number" />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="edit-material-subject">
          Subject
          <select className={inputClass} disabled={loadingSubjects || subjects.length === 0} id="edit-material-subject" onChange={(event) => setSubjectId(event.target.value)} value={subjectId}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} · {subject.code} · {subject.department.code} · Semester {subject.semester}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Cancel</button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60" disabled={saving || loadingSubjects} type="submit">
            {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

export function MyMaterialsList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Material | null>(null);

  const loadMaterials = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/materials/mine", { cache: "no-store" });
      const result = (await response.json()) as { materials?: Material[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load your materials.");
      setMaterials(result.materials ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load your materials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/materials/mine", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { materials?: Material[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load your materials.");
        return result.materials ?? [];
      })
      .then((items) => {
        if (active) setMaterials(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load your materials.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function deleteMaterial(material: Material) {
    if (!window.confirm(`Delete "${material.title}"?`)) return;
    try {
      const response = await fetch(`/api/materials/${encodeURIComponent(material.id)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete material.");
      setMaterials((current) => current.filter((item) => item.id !== material.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete material.");
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Your contributions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My Uploaded Materials</h1>
        <p className="mt-2 text-sm text-slate-600">Track review status and manage your pending submissions.</p>
      </header>
      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p> : null}
      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500" role="status">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Loading your materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="font-semibold text-slate-900">No uploaded materials yet</h2>
          <p className="mt-2 text-sm text-slate-500">Materials you submit will appear here with their review status.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={material.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={material.status} />
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{material.type.replaceAll("_", " ")}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{material.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {material.subject.name} · {material.subject.code} · {material.subject.department.name} · Semester {material.subject.semester}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {material.probidhan.replace("PROBIDHAN_", "Probidhan ")}{material.year ? ` · ${material.year}` : ""}
                  </p>
                  {material.status === "REJECTED" && material.rejectionReason ? (
                    <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <span className="font-semibold">Reason: </span>{material.rejectionReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isSafeUrl(material.fileUrl) ? (
                    <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={material.fileUrl} rel="noreferrer" target="_blank">
                      <Download aria-hidden="true" className="size-4" /> Preview
                    </a>
                  ) : null}
                  {material.status === "PENDING" ? (
                    <>
                      <button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-cyan-200 px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-50" onClick={() => setEditing(material)} type="button">
                        <Pencil aria-hidden="true" className="size-3.5" /> Edit
                      </button>
                      <button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => void deleteMaterial(material)} type="button">
                        <Trash2 aria-hidden="true" className="size-3.5" /> Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing ? (
        <EditMaterialDialog
          key={editing.id}
          material={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await loadMaterials();
          }}
        />
      ) : null}
    </section>
  );
}
