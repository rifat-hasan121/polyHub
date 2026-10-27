"use client";

import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FileText,
  LoaderCircle,
  School,
} from "lucide-react";
import { useEffect, useState } from "react";

type PendingMaterial = {
  id: string;
  title: string;
  fileUrl: string;
  type: string;
  probidhan: string;
  year: number | null;
  createdAt: string;
  subject: {
    name: string;
    code: string;
    semester: number;
    department: { name: string; code: string };
  };
  user: { name: string; polytechnic: string | null; email: string };
};

function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function MaterialModerationQueue() {
  const [materials, setMaterials] = useState<PendingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/materials", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { materials?: PendingMaterial[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load moderation queue.");
        return result.materials ?? [];
      })
      .then((items) => {
        if (active) setMaterials(items);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load moderation queue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function review(material: PendingMaterial, status: "APPROVED" | "REJECTED") {
    let rejectionReason: string | undefined;
    if (status === "REJECTED") {
      rejectionReason = window.prompt(`Reason for rejecting "${material.title}":`)?.trim();
      if (!rejectionReason) return;
    }

    setBusyId(material.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/materials/${encodeURIComponent(material.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          status === "APPROVED" ? { status } : { status, rejectionReason },
        ),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to review material.");
      setMaterials((current) => current.filter((item) => item.id !== material.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to review material.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Administration</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Material Moderation Queue</h1>
        <p className="mt-2 text-sm text-slate-600">Review submissions before they become visible in the public materials feed.</p>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p> : null}
      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500" role="status">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Loading pending materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <CheckCircle aria-hidden="true" className="mx-auto size-9 text-emerald-600" />
          <h2 className="mt-3 font-semibold text-slate-900">Queue is clear</h2>
          <p className="mt-1 text-sm text-slate-500">There are no materials waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600">{materials.length} pending submission{materials.length === 1 ? "" : "s"}</p>
          {materials.map((material) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={material.id}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      <AlertCircle aria-hidden="true" className="size-3.5" /> Pending review
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{material.type.replaceAll("_", " ")}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{material.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {material.subject.name} · Subject code {material.subject.code} · Semester {material.subject.semester}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {material.subject.department.name} ({material.subject.department.code}) · {material.probidhan.replace("PROBIDHAN_", "Probidhan ")}
                    {material.year ? ` · ${material.year}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <School aria-hidden="true" className="size-4 text-slate-400" />
                      <span><span className="font-semibold">{material.user.name}</span> · {material.user.polytechnic || "Polytechnic not provided"}</span>
                    </span>
                    <span className="text-xs text-slate-500">{material.user.email}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isSafeUrl(material.fileUrl) ? (
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={material.fileUrl} rel="noreferrer" target="_blank">
                      <FileText aria-hidden="true" className="size-4" /> Preview file <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                  ) : null}
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    disabled={busyId === material.id}
                    onClick={() => void review(material, "APPROVED")}
                    type="button"
                  >
                    {busyId === material.id ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <CheckCircle aria-hidden="true" className="size-4" />}
                    Approve
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    disabled={busyId === material.id}
                    onClick={() => void review(material, "REJECTED")}
                    type="button"
                  >
                    <AlertCircle aria-hidden="true" className="size-4" /> Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
