"use client";

import { MaterialType, Probidhan } from "@prisma/client";
import { LoaderCircle, UploadCloud, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type SubjectOption = {
  id: string;
  name: string;
  code: string;
  semester: number;
  probidhan: Probidhan;
  department: { name: string; code: string };
};

type UploadResult = {
  material?: { id: string; status: "PENDING" | "APPROVED" | "REJECTED" };
  error?: string;
};

const subjectDepartments = [
  { code: "CST", label: "Computer Science & Technology" },
  { code: "CE", label: "Civil Technology" },
  { code: "EEE", label: "Electrical & Electronic Engineering" },
  { code: "ME", label: "Mechanical Technology" },
  { code: "POWER", label: "Power Technology" },
  { code: "ET", label: "Electronics Technology" },
  { code: "RAC", label: "Refrigeration & Air Conditioning" },
] as const;

const departments = [
  { code: "CST", label: "Computer Science & Technology" },
  { code: "CE", label: "Civil Technology" },
  { code: "EEE", label: "Electrical & Electronic Engineering" },
  { code: "ME", label: "Mechanical Technology" },
  { code: "POWER", label: "Power Technology" },
  { code: "ET", label: "Electronics Technology" },
  { code: "RAC", label: "Refrigeration & Air Conditioning" },
];

const types: { value: MaterialType; label: string }[] = [
  { value: "NOTE", label: "Note" },
  { value: "QUESTION_BANK", label: "Question Bank" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "BOOK_PDF", label: "Book PDF" },
];

export function UploadMaterialModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [probidhan, setProbidhan] = useState<Probidhan>("PROBIDHAN_2022");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectCatalogEmpty, setSubjectCatalogEmpty] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectError, setSubjectError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ probidhan });
    if (department) params.set("department", department);
    if (semester) params.set("semester", semester);

    async function loadSubjects() {
      setSubjectsLoading(true);
      setSubjectError("");
      try {
        const response = await fetch(`/api/materials/subjects?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as { subjects?: SubjectOption[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load subjects.");
        const loadedSubjects = result.subjects ?? [];
        setSubjects(loadedSubjects);
        setSubjectCatalogEmpty(loadedSubjects.length === 0);
      } catch (caught) {
        if (
          controller.signal.aborted ||
          (caught instanceof Error && caught.name === "AbortError")
        ) return;
        setSubjects([]);
        setSubjectCatalogEmpty(false);
        setSubjectError(caught instanceof Error ? caught.message : "Unable to load subjects.");
      } finally {
        if (!controller.signal.aborted) setSubjectsLoading(false);
      }
    }

    void loadSubjects();
    return () => controller.abort();
  }, [department, probidhan, semester]);

  async function submitMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const yearValue = String(formData.get("year") ?? "").trim();
    const year = yearValue ? Number(yearValue) : null;

    if (yearValue && (!Number.isInteger(year) || year! < 1900 || year! > 2100)) {
      setFormError("Enter a valid year between 1900 and 2100.");
      return;
    }

    const newSubject = subjectCatalogEmpty
      ? {
          name: String(formData.get("subjectName") ?? "").trim(),
          code: String(formData.get("subjectCode") ?? "").trim().toUpperCase(),
          department: String(formData.get("subjectDepartment") ?? ""),
          semester: Number(formData.get("subjectSemester")),
        }
      : null;

    if (
      newSubject &&
      (!newSubject.name ||
        !/^[A-Z0-9_-]{1,20}$/.test(newSubject.code) ||
        !subjectDepartments.some(({ code }) => code === newSubject.department) ||
        !Number.isInteger(newSubject.semester) ||
        newSubject.semester < 1 ||
        newSubject.semester > 8)
    ) {
      setFormError("Enter a valid subject name, subject code, department, and semester.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          fileUrl: formData.get("fileUrl"),
          type: formData.get("type"),
          probidhan,
          subjectId: subjectCatalogEmpty ? null : formData.get("subjectId"),
          newSubject,
          year,
        }),
      });
      const result = (await response.json()) as UploadResult;
      if (!response.ok || !result.material) {
        throw new Error(result.error ?? "Unable to submit your material.");
      }
      setSubmittedStatus(result.material.status);
      onUploaded();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to submit your material.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <div
      aria-labelledby="upload-material-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      role="dialog"
    >
      <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id="upload-material-title">
              {submittedStatus ? "Material submitted" : "Upload a study material"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {submittedStatus
                ? submittedStatus === "APPROVED"
                  ? "Your material is approved and now available in the materials list."
                  : "Your material is pending moderator approval and will appear after review."
                : "Share a PDF link with students in your department."}
            </p>
          </div>
          <button
            aria-label="Close upload dialog"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {submittedStatus ? (
          <button
            className="mt-6 min-h-11 w-full rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(event) => void submitMaterial(event)}>
            <label className={labelClass} htmlFor="material-title">
              Title
              <input
                className={inputClass}
                id="material-title"
                maxLength={200}
                minLength={3}
                name="title"
                placeholder="Data Structures — Chapter 1 Notes"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass} htmlFor="material-type">
                Material type
                <select className={inputClass} id="material-type" name="type" required>
                  {types.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass} htmlFor="material-probidhan">
                Probidhan
                <select
                  className={inputClass}
                  id="material-probidhan"
                  onChange={(event) => setProbidhan(event.target.value as Probidhan)}
                  value={probidhan}
                >
                  <option value="PROBIDHAN_2022">Probidhan 2022</option>
                  <option value="PROBIDHAN_2016">Probidhan 2016</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass} htmlFor="material-department">
                Department
                <select
                  className={inputClass}
                  id="material-department"
                  onChange={(event) => setDepartment(event.target.value)}
                  value={department}
                >
                  <option value="">All departments</option>
                  {departments.map(({ code, label }) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass} htmlFor="material-semester">
                Semester
                <select
                  className={inputClass}
                  id="material-semester"
                  onChange={(event) => setSemester(event.target.value)}
                  value={semester}
                >
                  <option value="">All semesters</option>
                  {Array.from({ length: 8 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>{index + 1} Semester</option>
                  ))}
                </select>
              </label>
            </div>

            <label className={labelClass} htmlFor="material-subject">
              Subject
              {subjectCatalogEmpty ? (
                <div className="mt-1.5 grid gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-xs leading-5 text-amber-900">
                    The subject catalog is empty. Add the subject details below to include them with your submission.
                  </p>
                  <input
                    className={inputClass}
                    aria-label="Subject name"
                    maxLength={120}
                    name="subjectName"
                    placeholder="Subject name"
                    required
                  />
                  <input
                    className={inputClass}
                    aria-label="Subject code"
                    maxLength={20}
                    name="subjectCode"
                    placeholder="Subject code, e.g. 28511"
                    required
                  />
                  <select
                    className={inputClass}
                    aria-label="Subject department"
                    defaultValue=""
                    name="subjectDepartment"
                    required
                  >
                    <option disabled value="">Select department</option>
                    {subjectDepartments.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    aria-label="Subject semester"
                    defaultValue=""
                    name="subjectSemester"
                    required
                  >
                    <option disabled value="">Select semester</option>
                    {Array.from({ length: 8 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>{index + 1} Semester</option>
                    ))}
                  </select>
                </div>
              ) : (
                <select
                  className={inputClass}
                  disabled={subjectsLoading || subjects.length === 0}
                  id="material-subject"
                  name="subjectId"
                  required
                >
                  <option value="">
                    {subjectsLoading ? "Loading subjects..." : "Select a subject"}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} · {subject.code} · {subject.department.code} · Semester {subject.semester}
                    </option>
                  ))}
                </select>
              )}
              {subjectError ? <span className="mt-1 block text-xs text-red-700">{subjectError}</span> : null}
              {!subjectsLoading && !subjectCatalogEmpty && !subjectError && subjects.length === 0 ? (
                <span className="mt-1 block text-xs text-amber-700">No subjects found for these filters.</span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass} htmlFor="material-year">
                Exam year (optional)
                <input
                  className={inputClass}
                  id="material-year"
                  max="2100"
                  min="1900"
                  name="year"
                  placeholder="2024"
                  type="number"
                />
              </label>
              <label className={labelClass} htmlFor="material-file-url">
                PDF URL
                <input
                  className={inputClass}
                  id="material-file-url"
                  name="fileUrl"
                  placeholder="https://drive.google.com/..."
                  required
                  type="url"
                />
              </label>
            </div>
            <p className="-mt-2 text-xs leading-5 text-slate-500">
              Use a shareable Google Drive, S3, or UploadThing link. Upload the PDF to a file host first.
            </p>

            {formError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{formError}</p>
            ) : null}

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
                disabled={saving || subjectsLoading || (!subjectCatalogEmpty && subjects.length === 0)}
                type="submit"
              >
                {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <UploadCloud aria-hidden="true" className="size-4" />}
                Submit for review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
