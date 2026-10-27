"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileText,
  LoaderCircle,
  PlayCircle,
} from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description: string;
  category: "DUET_NON_DEPT" | "DUET_DEPT";
  department: string | null;
  subject: string | null;
  year: number | null;
  fileUrl: string | null;
  videoUrl: string | null;
};

type ResourceResponse = {
  resources?: Resource[];
  error?: string;
};

const demoResources: Resource[] = [
  {
    id: "demo-math",
    title: "DUET ভর্তি গণিত প্রস্তুতি: বীজগণিত ও ক্যালকুলাস",
    description: "গুরুত্বপূর্ণ সূত্র, অধ্যায়ভিত্তিক অনুশীলন এবং প্রস্তুতির নমুনা পরিকল্পনা।",
    category: "DUET_NON_DEPT",
    department: null,
    subject: "Math",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
  {
    id: "demo-physics",
    title: "পদার্থবিজ্ঞান: মেকানিক্স ও বিদ্যুৎ",
    description: "DUET নন-ডিপার্টমেন্ট প্রস্তুতির জন্য বিষয়ভিত্তিক রিভিশন গাইড।",
    category: "DUET_NON_DEPT",
    department: null,
    subject: "Physics",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
  {
    id: "demo-cst",
    title: "CST বিভাগ: প্রোগ্রামিং ও ডেটাবেজ বেসিক",
    description: "বিভাগীয় প্রস্তুতির নমুনা টপিক তালিকা।",
    category: "DUET_DEPT",
    department: "CST",
    subject: "Computer",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
  {
    id: "demo-civil",
    title: "Civil বিভাগ: স্ট্রাকচার ও সার্ভেয়িং",
    description: "বিভাগীয় প্রস্তুতির নমুনা টপিক তালিকা।",
    category: "DUET_DEPT",
    department: "CE",
    subject: "Civil",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
  {
    id: "demo-eee",
    title: "EEE বিভাগ: সার্কিট ও ইলেকট্রনিক্স",
    description: "বিভাগীয় প্রস্তুতির নমুনা টপিক তালিকা।",
    category: "DUET_DEPT",
    department: "EEE",
    subject: "Electrical",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
  {
    id: "demo-mechanical",
    title: "Mechanical বিভাগ: থার্মোডাইনামিক্স ও মেকানিক্স",
    description: "বিভাগীয় প্রস্তুতির নমুনা টপিক তালিকা।",
    category: "DUET_DEPT",
    department: "ME",
    subject: "Mechanical",
    year: 2024,
    fileUrl: null,
    videoUrl: null,
  },
];

const departments = [
  { code: "CST", label: "কম্পিউটার (CST)" },
  { code: "CE", label: "সিভিল (Civil)" },
  { code: "EEE", label: "ইলেকট্রিক্যাল (EEE)" },
  { code: "ET", label: "ইলেকট্রনিক্স (Electronics)" },
  { code: "ME", label: "মেকানিক্যাল (Mechanical)" },
  { code: "POWER", label: "পাওয়ার (Power)" },
  { code: "RAC", label: "রেফ্রিজারেশন (RAC)" },
];

const subjects = ["Math", "Physics", "Chemistry", "English"];

function externalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function DuetHub() {
  const [category, setCategory] = useState<"DUET_NON_DEPT" | "DUET_DEPT">("DUET_NON_DEPT");
  const [department, setDepartment] = useState("CST");
  const [subject, setSubject] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isDemo = !loading && !error && resources.length === 0;
  const visibleResources = isDemo
    ? demoResources.filter((resource) =>
        resource.category === category &&
        (category === "DUET_DEPT"
          ? resource.department === department
          : !subject || resource.subject === subject),
      )
    : resources;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ category });
    if (category === "DUET_DEPT") params.set("department", department);
    if (category === "DUET_NON_DEPT" && subject) params.set("subject", subject);

    async function loadResources() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/higher-study?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as ResourceResponse;
        if (!response.ok) throw new Error(result.error ?? "রিসোর্স লোড করা যায়নি।");
        setResources(result.resources ?? []);
      } catch (caught) {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setResources([]);
        setError(caught instanceof Error ? caught.message : "রিসোর্স লোড করা যায়নি।");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadResources();
    return () => controller.abort();
  }, [category, department, subject]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="DUET preparation category">
          <button
            aria-pressed={category === "DUET_NON_DEPT"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === "DUET_NON_DEPT"
                ? "bg-cyan-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => {
              setCategory("DUET_NON_DEPT");
              setSubject("");
            }}
            type="button"
          >
            Non-Department (Math, Physics, Chem, English)
          </button>
          <button
            aria-pressed={category === "DUET_DEPT"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === "DUET_DEPT"
                ? "bg-cyan-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => {
              setCategory("DUET_DEPT");
              setSubject("");
            }}
            type="button"
          >
            Department-wise (CST, Civil, EEE, Mechanical)
          </button>
        </div>

        {category === "DUET_DEPT" ? (
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:max-w-xs">
            আপনার ডিপার্টমেন্ট
            <select
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              {departments.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by subject">
            <button
              aria-pressed={!subject}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                !subject ? "border-cyan-700 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600"
              }`}
              onClick={() => setSubject("")}
              type="button"
            >
              All subjects
            </button>
            {subjects.map((item) => (
              <button
                aria-pressed={subject === item}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  subject === item ? "border-cyan-700 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600"
                }`}
                key={item}
                onClick={() => setSubject(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div aria-live="polite" className="mt-5">
        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            প্রস্তুতির রিসোর্স লোড হচ্ছে...
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
        ) : visibleResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <BookOpen aria-hidden="true" className="mx-auto size-8 text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">এখনো কোনো রিসোর্স যোগ করা হয়নি</h3>
            <p className="mt-1 text-sm text-slate-500">নতুন নোট ও লেকচার যুক্ত হলে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <>
            {isDemo ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                ডেমো কনটেন্ট — আসল নোট ও লেকচার যুক্ত হলে এখানে দেখানো হবে।
              </p>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleResources.map((resource) => {
              const fileUrl = externalUrl(resource.fileUrl);
              const videoUrl = externalUrl(resource.videoUrl);
              return (
                <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={resource.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                      {resource.subject || resource.department || "DUET"}
                    </span>
                    {resource.year ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{resource.year}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-950">{resource.title}</h3>
                  <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">{resource.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {fileUrl ? (
                      <a className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800" href={fileUrl} rel="noreferrer" target="_blank">
                        <Download aria-hidden="true" className="size-4" />
                        Download Note/PDF
                      </a>
                    ) : (
                      <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
                        <FileText aria-hidden="true" className="size-4" />
                        PDF not added
                      </span>
                    )}
                    {videoUrl ? (
                      <a className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={videoUrl} rel="noreferrer" target="_blank">
                        <PlayCircle aria-hidden="true" className="size-4" />
                        Watch Lecture
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
