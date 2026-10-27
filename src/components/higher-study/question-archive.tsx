"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Download,
  FileCheck2,
  FileQuestion,
  LoaderCircle,
} from "lucide-react";

type QuestionResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string | null;
  subject: string | null;
  year: number | null;
  fileUrl: string | null;
  questionPaperUrl: string | null;
  answerKeyUrl: string | null;
  solutionUrl: string | null;
};

type ResponseBody = {
  resources?: QuestionResource[];
  error?: string;
};

const demoResources: QuestionResource[] = [
  {
    id: "demo-question-2023",
    title: "DUET ভর্তি পরীক্ষা — নমুনা প্রশ্নপত্র",
    description: "বিগত বছরের প্রশ্ন ও সমাধান যুক্ত করার জন্য ডেমো এন্ট্রি।",
    category: "DUET_NON_DEPT",
    department: null,
    subject: "Math",
    year: 2023,
    fileUrl: null,
    questionPaperUrl: null,
    answerKeyUrl: null,
    solutionUrl: null,
  },
  {
    id: "demo-question-2022",
    title: "DUET ভর্তি পরীক্ষা — নমুনা প্রশ্নপত্র",
    description: "বিগত বছরের প্রশ্ন ও সমাধান যুক্ত করার জন্য ডেমো এন্ট্রি।",
    category: "DUET_NON_DEPT",
    department: null,
    subject: "Physics",
    year: 2022,
    fileUrl: null,
    questionPaperUrl: null,
    answerKeyUrl: null,
    solutionUrl: null,
  },
  {
    id: "demo-question-2021",
    title: "DUET ভর্তি পরীক্ষা — নমুনা প্রশ্নপত্র",
    description: "বিগত বছরের প্রশ্ন ও সমাধান যুক্ত করার জন্য ডেমো এন্ট্রি।",
    category: "DUET_NON_DEPT",
    department: null,
    subject: "English",
    year: 2021,
    fileUrl: null,
    questionPaperUrl: null,
    answerKeyUrl: null,
    solutionUrl: null,
  },
];

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function QuestionArchive() {
  const [resources, setResources] = useState<QuestionResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isDemo = !loading && !error && resources.length === 0;
  const visibleResources = isDemo ? demoResources : resources;

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestions() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/higher-study?resourceType=QUESTION_BANK", {
          signal: controller.signal,
        });
        const result = (await response.json()) as ResponseBody;
        if (!response.ok) throw new Error(result.error ?? "প্রশ্নব্যাংক লোড করা যায়নি।");
        setResources(result.resources ?? []);
      } catch (caught) {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setResources([]);
        setError(caught instanceof Error ? caught.message : "প্রশ্নব্যাংক লোড করা যায়নি।");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadQuestions();
    return () => controller.abort();
  }, []);

  const groups = visibleResources.reduce<Record<string, QuestionResource[]>>((result, resource) => {
    const year = resource.year ? String(resource.year) : "বছর উল্লেখ নেই";
    (result[year] ??= []).push(resource);
    return result;
  }, {});
  const years = Object.keys(groups).sort((a, b) => {
    if (a === "বছর উল্লেখ নেই") return 1;
    if (b === "বছর উল্লেখ নেই") return -1;
    return Number(b) - Number(a);
  });

  return (
    <section aria-label="DUET question bank and solutions">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-950">বিগত বছরের প্রশ্ন ও সমাধান</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          বছর অনুযায়ী প্রশ্নপত্র, উত্তরসূচি এবং সমাধানের হ্যান্ডনোট দেখুন।
        </p>
      </div>
      {loading ? (
        <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-500">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          প্রশ্নব্যাংক লোড হচ্ছে...
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : years.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <FileQuestion aria-hidden="true" className="mx-auto size-8 text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-900">প্রশ্নপত্র এখনো যোগ করা হয়নি</h3>
          <p className="mt-1 text-sm text-slate-500">প্রশ্নব্যাংক যুক্ত হলে বছর অনুযায়ী এখানে দেখা যাবে।</p>
        </div>
      ) : (
        <>
        {isDemo ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ডেমো কনটেন্ট — প্রশ্নপত্র, উত্তরসূচি ও সমাধানের লিংক এখনো যোগ করা হয়নি।
          </p>
        ) : null}
        <div className="space-y-3">
          {years.map((year, index) => (
            <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm" key={year} open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <FileQuestion aria-hidden="true" className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-950">{year === "বছর উল্লেখ নেই" ? year : `DUET ${year}-${String(Number(year) + 1).slice(-2)}`}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{groups[year].length}টি রিসোর্স</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-3 border-t border-slate-100 p-4 sm:p-5">
                {groups[year].map((resource) => {
                  const paperUrl = safeUrl(resource.questionPaperUrl ?? resource.fileUrl);
                  const answerUrl = safeUrl(resource.answerKeyUrl);
                  const solutionUrl = safeUrl(resource.solutionUrl);
                  return (
                    <article className="rounded-xl border border-slate-200 p-4" key={resource.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {resource.subject ? <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">{resource.subject}</span> : null}
                            {resource.department ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{resource.department}</span> : null}
                          </div>
                          <h3 className="mt-2 font-semibold text-slate-900">{resource.title}</h3>
                          {resource.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{resource.description}</p> : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {paperUrl ? (
                          <a className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800" href={paperUrl} rel="noreferrer" target="_blank">
                            <Download aria-hidden="true" className="size-3.5" /> প্রশ্নপত্র
                          </a>
                        ) : null}
                        {answerUrl ? (
                          <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={answerUrl} rel="noreferrer" target="_blank">
                            <FileCheck2 aria-hidden="true" className="size-3.5" /> Answer key
                            <ArrowUpRight aria-hidden="true" className="size-3" />
                          </a>
                        ) : null}
                        {solutionUrl ? (
                          <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={solutionUrl} rel="noreferrer" target="_blank">
                            <FileCheck2 aria-hidden="true" className="size-3.5" /> Solution handnote
                            <ArrowUpRight aria-hidden="true" className="size-3" />
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
        </>
      )}
    </section>
  );
}
