"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Download,
  FileQuestion,
  FileText,
  LogIn,
  UploadCloud,
  Search,
} from "lucide-react";
import type { MaterialType, Probidhan } from "@prisma/client";
import { UploadMaterialModal } from "@/components/materials/upload-material-modal";

type MaterialResult = {
  id: string;
  title: string;
  fileUrl: string;
  type: MaterialType;
  probidhan: Probidhan;
  createdAt: string;
  subject: {
    name: string;
    code: string;
    semester: number;
    department: {
      name: string;
      code: string;
    };
  };
};

const departments = [
  { code: "", name: "All departments" },
  { code: "CST", name: "Computer Science & Technology" },
  { code: "CE", name: "Civil Technology" },
  { code: "EEE", name: "Electrical & Electronic Engineering" },
  { code: "ME", name: "Mechanical Technology" },
  { code: "POWER", name: "Power Technology" },
  { code: "ET", name: "Electronics Technology" },
  { code: "RAC", name: "Refrigeration & Air Conditioning" },
];

const materialFilters: { value: MaterialType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "NOTE", label: "Notes" },
  { value: "QUESTION_BANK", label: "Question Bank" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "BOOK_PDF", label: "Book PDFs" },
];

const materialLabels: Record<MaterialType, string> = {
  NOTE: "Note",
  QUESTION_BANK: "Question Bank",
  SYLLABUS: "Syllabus",
  BOOK_PDF: "Book PDF",
};

function formatProbidhan(probidhan: Probidhan) {
  return probidhan === "PROBIDHAN_2022" ? "Probidhan 2022" : "Probidhan 2016";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function MaterialSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex justify-between">
        <div className="size-10 rounded-xl bg-slate-100" />
        <div className="h-6 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="h-5 w-3/4 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
      <div className="mt-6 h-10 rounded-lg bg-slate-100" />
    </div>
  );
}

function MaterialsPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const queryDepartment = searchParams.get("department")?.toUpperCase() ?? "";
  const querySemester = searchParams.get("semester") ?? "";
  const queryProbidhan = searchParams.get("probidhan");
  const [department, setDepartment] = useState(
    departments.some((item) => item.code === queryDepartment) ? queryDepartment : "",
  );
  const [semester, setSemester] = useState(/^[1-8]$/.test(querySemester) ? querySemester : "");
  const [probidhan, setProbidhan] = useState<Probidhan | "">(
    queryProbidhan === "PROBIDHAN_2016" || queryProbidhan === "PROBIDHAN_2022"
      ? queryProbidhan
      : "",
  );
  const [type, setType] = useState<MaterialType | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [materials, setMaterials] = useState<MaterialResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkError, setBookmarkError] = useState("");
  const [savedMaterialIds, setSavedMaterialIds] = useState<string[]>([]);
  const [updatingBookmarkId, setUpdatingBookmarkId] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const controller = new AbortController();
    async function loadSavedMaterials() {
      try {
        const response = await fetch("/api/materials/bookmarks", {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          materialIds?: string[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load saved materials.");
        }
        setSavedMaterialIds(result.materialIds ?? []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setBookmarkError(
          caught instanceof Error ? caught.message : "Unable to load saved materials.",
        );
      }

    }

    void loadSavedMaterials();
    return () => controller.abort();
  }, [sessionStatus]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (semester) params.set("semester", semester);
    if (probidhan) params.set("probidhan", probidhan);
    if (type) params.set("type", type);
    if (search) params.set("search", search);

    async function loadMaterials() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/materials?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          materials?: MaterialResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load materials.");
        }

        setMaterials(result.materials ?? []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        const reason =
          caught instanceof Error
            ? caught.message
            : "Unable to load live materials right now.";
        setError(`Live materials could not be loaded (${reason}).`);
        setMaterials([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadMaterials();
    return () => controller.abort();
  }, [department, probidhan, refreshKey, search, semester, type]);

  async function toggleBookmark(materialId: string) {
    const currentlySaved = savedMaterialIds.includes(materialId);
    setBookmarkError("");
    setUpdatingBookmarkId(materialId);
    try {
      const response = await fetch("/api/materials/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, saved: !currentlySaved }),
      });
      const result = (await response.json()) as { saved?: boolean; error?: string };
      if (!response.ok || result.saved === undefined) {
        throw new Error(result.error ?? "Unable to update saved materials.");
      }
      setSavedMaterialIds((current) =>
        result.saved
          ? [...new Set([...current, materialId])]
          : current.filter((id) => id !== materialId),
      );
    } catch (caught) {
      setBookmarkError(
        caught instanceof Error ? caught.message : "Unable to update saved materials.",
      );
    } finally {
      setUpdatingBookmarkId("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Learn and prepare
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Academic Materials &amp; Question Bank
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Browse notes, syllabi, books, and past questions from polytechnic
          students.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full max-w-2xl">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Search materials and subjects"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search subjects or materials..."
              type="search"
              value={searchInput}
            />
          </label>
          {sessionStatus === "authenticated" && session?.user ? (
            <button
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
              onClick={() => setUploadModalOpen(true)}
              type="button"
            >
              <UploadCloud aria-hidden="true" className="size-4" />
              Upload Material
            </button>
          ) : sessionStatus === "unauthenticated" ? (
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-700 bg-white px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50"
              href="/login?callbackUrl=%2Fmaterials"
            >
              <LogIn aria-hidden="true" className="size-4" />
              Login to Upload
            </Link>
          ) : null}
        </div>
      </header>

      <section
        aria-label="Filter materials"
        className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto]">
          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              {departments.map((item) => (
                <option key={item.code || "all"} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Semester
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setSemester(event.target.value)}
              value={semester}
            >
              <option value="">All semesters</option>
              {Array.from({ length: 8 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                  {["st", "nd", "rd"][index] ?? "th"} Semester
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              Probidhan
            </legend>
            <div className="mt-1.5 flex h-11 rounded-lg border border-slate-300 bg-slate-50 p-1">
              {(
                [
                  ["", "All"],
                  ["PROBIDHAN_2022", "2022"],
                  ["PROBIDHAN_2016", "2016"],
                ] as const
              ).map(([value, label]) => (
                <button
                  aria-pressed={probidhan === value}
                  className={`flex-1 rounded-md px-3 text-sm font-semibold transition ${
                    probidhan === value
                      ? "bg-white text-cyan-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  key={value}
                  onClick={() => setProbidhan(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Material type
          </p>
          <div className="flex flex-wrap gap-2">
            {materialFilters.map((filter) => (
              <button
                aria-pressed={type === filter.value}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  type === filter.value
                    ? "border-cyan-700 bg-cyan-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
                key={filter.value || "all"}
                onClick={() => setType(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div
        aria-live="polite"
        className="mb-4 flex min-h-6 items-center justify-between"
      >
        <p className="text-sm text-slate-600">
          {isLoading
            ? "Finding materials..."
            : `${materials.length} ${materials.length === 1 ? "material" : "materials"} found${materials.length === 30 ? " (showing latest 30)" : ""}`}
        </p>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {bookmarkError ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {bookmarkError}
        </p>
      ) : null}

      {error ? null : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <MaterialSkeleton key={index} />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <FileQuestion aria-hidden="true" className="size-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No materials found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Only approved uploads appear here. Try changing your filters, or check
            My Uploads to see whether your submission is still awaiting review.
          </p>
          {sessionStatus === "authenticated" ? (
            <Link className="mt-4 inline-flex text-sm font-semibold text-cyan-800 hover:underline" href="/dashboard/my-materials">
              View my uploads
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <article
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
              key={material.id}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  {material.type === "QUESTION_BANK" ? (
                    <FileQuestion aria-hidden="true" className="size-5" />
                  ) : material.type === "BOOK_PDF" ? (
                    <BookOpen aria-hidden="true" className="size-5" />
                  ) : (
                    <FileText aria-hidden="true" className="size-5" />
                  )}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {sessionStatus === "authenticated" ? (
                    <button
                      aria-label={
                        savedMaterialIds.includes(material.id)
                          ? `Remove ${material.title} from saved materials`
                          : `Save ${material.title}`
                      }
                      aria-pressed={savedMaterialIds.includes(material.id)}
                      className="rounded-full p-1.5 text-cyan-800 transition hover:bg-cyan-50 disabled:opacity-50"
                      disabled={updatingBookmarkId === material.id}
                      onClick={() => void toggleBookmark(material.id)}
                      title={
                        savedMaterialIds.includes(material.id)
                          ? "Remove from saved materials"
                          : "Save material"
                      }
                      type="button"
                    >
                      {savedMaterialIds.includes(material.id) ? (
                        <BookmarkCheck aria-hidden="true" className="size-5" />
                      ) : (
                        <Bookmark aria-hidden="true" className="size-5" />
                      )}
                    </button>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {materialLabels[material.type]}
                  </span>
                </div>
              </div>
              <h2 className="line-clamp-2 text-lg font-semibold leading-6 text-slate-950">
                {material.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {material.subject.name}
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-medium text-slate-700">
                  {material.subject.code}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {material.subject.department.name} (
                {material.subject.department.code}) · Semester{" "}
                {material.subject.semester}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                  {formatProbidhan(material.probidhan)}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {formatDate(material.createdAt)}
                </span>
              </div>
              <a
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800"
                href={material.fileUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Download aria-hidden="true" className="size-4" />
                Download / View PDF
              </a>
            </article>
          ))}
        </div>
      )}
      {uploadModalOpen ? (
        <UploadMaterialModal
          onClose={() => setUploadModalOpen(false)}
          onUploaded={() => setRefreshKey((current) => current + 1)}
        />
      ) : null}
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
      <MaterialsPageContent />
    </Suspense>
  );
}
