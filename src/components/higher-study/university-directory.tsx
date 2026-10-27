"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Landmark,
  LoaderCircle,
  Search,
} from "lucide-react";

type University = {
  id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE" | "INTERNATIONAL";
  waiverSummary: string;
  costPerSemester: string | null;
  admissionDetails: string | null;
  websiteUrl: string | null;
  circularUrl: string | null;
};

type ResponseBody = {
  universities?: University[];
  error?: string;
};

const demoUniversities: University[] = [
  {
    id: "demo-brac-university",
    name: "BRAC University",
    type: "PRIVATE",
    waiverSummary: "ডেমো নীতি: ডিপ্লোমা ক্রেডিট মূল্যায়ন বিভাগ ও ট্রান্সক্রিপ্ট অনুযায়ী যাচাই করতে হবে।",
    costPerSemester: "ডেমো হিসাব: ৳৮০,০০০–৳১,৫০,০০০; অফিসিয়াল ফি নয়",
    admissionDetails: "ভর্তি যোগ্যতা, ক্রেডিট ট্রান্সফার ও ফি সর্বশেষ ভর্তি বিজ্ঞপ্তি থেকে নিশ্চিত করুন।",
    websiteUrl: "https://www.bracu.ac.bd/",
    circularUrl: null,
  },
  {
    id: "demo-aiub",
    name: "American International University-Bangladesh",
    type: "PRIVATE",
    waiverSummary: "ডেমো নীতি: পূর্ববর্তী কোর্সের সমমান যাচাই সাপেক্ষে ক্রেডিট ট্রান্সফার হতে পারে।",
    costPerSemester: "ডেমো হিসাব: ৳৭০,০০০–৳১,৪০,০০০; অফিসিয়াল ফি নয়",
    admissionDetails: "ডিপ্লোমা-পরবর্তী বিএসসি ভর্তির শর্ত ও সম্ভাব্য ক্রেডিট ছাড় বিশ্ববিদ্যালয়ে যাচাই করুন।",
    websiteUrl: "https://www.aiub.edu/",
    circularUrl: null,
  },
  {
    id: "demo-university-of-malaysia",
    name: "Universiti Teknologi Malaysia",
    type: "INTERNATIONAL",
    waiverSummary: "ডেমো নীতি: আন্তর্জাতিক ক্রেডিট ট্রান্সফার প্রোগ্রাম ও পূর্বশিক্ষা যাচাইসাপেক্ষ।",
    costPerSemester: "ডেমো হিসাব: ৳১,৫০,০০০–৳৩,০০,০০০ সমপরিমাণ; অফিসিয়াল ফি নয়",
    admissionDetails: "আন্তর্জাতিক শিক্ষার্থীদের যোগ্যতা, ক্রেডিট স্বীকৃতি ও ফি সরাসরি বিশ্ববিদ্যালয়ে যাচাই করুন।",
    websiteUrl: "https://www.utm.my/",
    circularUrl: null,
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

const typeLabels: Record<University["type"], string> = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  INTERNATIONAL: "International",
};

export function UniversityDirectory() {
  const [search, setSearch] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isDemo = !loading && !error && universities.length === 0;
  const visibleUniversities = isDemo
    ? demoUniversities.filter((university) =>
        university.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : universities;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      async function loadUniversities() {
        setLoading(true);
        setError("");
        try {
          const params = new URLSearchParams();
          if (search.trim()) params.set("search", search.trim());
          const response = await fetch(`/api/higher-study/universities?${params}`, {
            signal: controller.signal,
          });
          const result = (await response.json()) as ResponseBody;
          if (!response.ok) throw new Error(result.error ?? "বিশ্ববিদ্যালয়ের তথ্য লোড করা যায়নি।");
          setUniversities(result.universities ?? []);
        } catch (caught) {
          if (caught instanceof Error && caught.name === "AbortError") return;
          setUniversities([]);
          setError(caught instanceof Error ? caught.message : "বিশ্ববিদ্যালয়ের তথ্য লোড করা যায়নি।");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }

      void loadUniversities();
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  return (
    <section aria-label="University directory and diploma waivers">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">বিশ্ববিদ্যালয় ও ক্রেডিট ওয়েভার</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">ডিপ্লোমা শেষে বিএসসি ভর্তির তথ্য, ক্রেডিট ছাড় ও সম্ভাব্য খরচ খুঁজুন।</p>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="বিশ্ববিদ্যালয়ের নাম দিয়ে খুঁজুন"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search university..."
            type="search"
            value={search}
          />
        </label>
      </div>

      <div aria-live="polite">
        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            বিশ্ববিদ্যালয়ের তালিকা লোড হচ্ছে...
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
        ) : visibleUniversities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <Landmark aria-hidden="true" className="mx-auto size-8 text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">কোনো বিশ্ববিদ্যালয়ের তথ্য পাওয়া যায়নি</h3>
            <p className="mt-1 text-sm text-slate-500">অনুসন্ধান পরিবর্তন করুন অথবা তথ্য যোগ হওয়া পর্যন্ত অপেক্ষা করুন।</p>
          </div>
        ) : (
          <>
          {isDemo ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ডেমো তথ্য — ক্রেডিট ওয়েভার ও খরচের অঙ্ক উদাহরণমাত্র; সিদ্ধান্তের আগে বিশ্ববিদ্যালয়ের অফিসিয়াল তথ্য যাচাই করুন।
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleUniversities.map((university) => {
              const externalUrl = safeUrl(university.circularUrl) ?? safeUrl(university.websiteUrl);
              return (
                <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={university.id}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <Landmark aria-hidden="true" className="size-5" />
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      university.type === "PUBLIC" ? "bg-emerald-50 text-emerald-800" :
                        university.type === "PRIVATE" ? "bg-blue-50 text-blue-800" : "bg-violet-50 text-violet-800"
                    }`}>
                      {typeLabels[university.type]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-slate-950">{university.name}</h3>
                  <div className="mt-4 rounded-xl bg-cyan-50 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Diploma credit waiver</p>
                    <p className="mt-1 text-sm leading-6 text-cyan-950">{university.waiverSummary}</p>
                  </div>
                  {university.costPerSemester ? (
                    <p className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold">Approx. cost/semester:</span> {university.costPerSemester}
                    </p>
                  ) : null}
                  {university.admissionDetails ? (
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{university.admissionDetails}</p>
                  ) : <div className="flex-1" />}
                  {externalUrl ? (
                    <a className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" href={externalUrl} rel="noreferrer" target="_blank">
                      <ExternalLink aria-hidden="true" className="size-4" />
                      Admission circular / website
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  ) : (
                    <span className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500">Link not added</span>
                  )}
                </article>
              );
            })}
          </div>
          </>
        )}
      </div>
    </section>
  );
}
