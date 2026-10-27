"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  LoaderCircle,
  Search,
  ShieldAlert,
} from "lucide-react";

type Notice = {
  id: string;
  title: string;
  publishDate: string | null;
  fileUrl: string;
  isImportant: boolean;
  isResultPdf: boolean;
};

type ExamResult = {
  roll: string;
  gpa: number | null;
  passed: boolean;
  failedSubjects: string[];
  notice: {
    title: string;
    publishDate: string | null;
  };
};

type ResultResponse = {
  roll: string;
  found: boolean;
  status: "NOT_FOUND" | "REFERRED" | "PASSED";
  results: ExamResult[];
  error?: string;
};

function formatPublishDate(value: string | null) {
  if (!value) return "তারিখ উল্লেখ নেই";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      type: "notices",
      page: String(page),
      pageSize: "15",
    });
    if (search) params.set("search", search);

    async function loadNotices() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/bteb?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          notices?: Notice[];
          totalPages?: number;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "নোটিশ লোড করা যায়নি।");
        }
        setNotices(result.notices ?? []);
        setTotalPages(result.totalPages ?? 0);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error ? caught.message : "নোটিশ লোড করা যায়নি।",
        );
        setNotices([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadNotices();
    return () => controller.abort();
  }, [page, search]);

  return (
    <section aria-label="BTEB notice board">
      <label className="relative block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-label="নোটিশ খুঁজুন"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="নোটিশের শিরোনাম দিয়ে খুঁজুন..."
          type="search"
          value={searchInput}
        />
      </label>

      <div aria-live="polite" className="mt-4 min-h-6">
        <p className="text-sm text-slate-600">
          {isLoading ? "নোটিশ খোঁজা হচ্ছে..." : `${notices.length}টি নোটিশ`}
        </p>
      </div>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : isLoading ? (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div aria-hidden="true" className="h-24 animate-pulse rounded-xl bg-white" key={index} />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileText aria-hidden="true" className="mx-auto size-9 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">কোনো নোটিশ পাওয়া যায়নি</h2>
          <p className="mt-1 text-sm text-slate-600">অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন।</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {notices.map((notice) => {
            const fileUrl = safeExternalUrl(notice.fileUrl);
            return (
            <article
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
              key={notice.id}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold leading-6 text-slate-950">{notice.title}</h2>
                    {notice.isImportant ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                        জরুরী
                      </span>
                    ) : null}
                    {notice.isResultPdf ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        ফলাফল
                      </span>
                    ) : null}
                  </div>
                  <time className="mt-1 block text-sm text-slate-500" dateTime={notice.publishDate ?? undefined}>
                    প্রকাশিত: {formatPublishDate(notice.publishDate)}
                  </time>
                </div>
              </div>
              {fileUrl ? (
                <a
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-cyan-200 bg-cyan-50 px-3.5 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 sm:self-center"
                  href={fileUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ArrowDownToLine aria-hidden="true" className="size-4" />
                  দেখুন / ডাউনলোড
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              ) : (
                <span className="text-sm text-slate-500">লিংক উপলভ্য নয়</span>
              )}
            </article>
            );
          })}
        </div>
      )}

      <nav aria-label="Notice pages" className="mt-6 flex items-center justify-between">
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          আগের পাতা
        </button>
        <span className="text-sm text-slate-600">
          {totalPages > 0 ? `${page} / ${totalPages}` : "—"}
        </span>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((current) => current + 1)}
          type="button"
        >
          পরের পাতা
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </nav>
    </section>
  );
}

function ResultSearch() {
  const [rollInput, setRollInput] = useState("");
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const roll = rollInput.trim();
    if (!/^\d{6}$/.test(roll)) {
      setError("সঠিক ৬ সংখ্যার রোল নম্বর লিখুন।");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/bteb?${new URLSearchParams({ type: "result", roll })}`);
      const data = (await response.json()) as ResultResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "ফলাফল খোঁজা যায়নি।");
      }
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ফলাফল খোঁজা যায়নি।");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section aria-label="বোর্ড রেজাল্ট সার্চ">
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit}
      >
        <label className="block text-sm font-semibold text-slate-800" htmlFor="roll-number">
          ৬ সংখ্যার রোল নম্বর
          <input
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 text-lg tracking-[0.18em] text-slate-950 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10 sm:max-w-sm"
            id="roll-number"
            inputMode="numeric"
            maxLength={6}
            minLength={6}
            onChange={(event) => setRollInput(event.target.value.replace(/\D/g, "").slice(0, 6))}
            pattern="\d{6}"
            placeholder="যেমন: 612345"
            required
            value={rollInput}
          />
        </label>
        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Search aria-hidden="true" className="size-4" />
          )}
          {isSearching ? "খোঁজা হচ্ছে..." : "ফলাফল দেখুন"}
        </button>
      </form>

      {error ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {result && !result.found ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-950" role="status">
          <h2 className="font-semibold">প্রকাশিত ফলাফলে এই রোলটি পাওয়া যায়নি</h2>
          <p className="mt-1 text-sm text-amber-900">
            রোল নম্বরটি যাচাই করুন, অথবা পরে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : null}

      {result?.found ? (
        <div aria-live="polite" className="mt-5 space-y-4">
          {result.results.map((item, index) => (
            <article
              className={`rounded-2xl border p-5 shadow-sm sm:p-7 ${
                item.passed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
              key={`${item.roll}-${item.notice.title}-${index}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">রোল নম্বর</p>
                  <p className="mt-1 text-2xl font-bold tracking-wider text-slate-950">{item.roll}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ${
                    item.passed
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-amber-200 text-amber-950"
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                  ) : (
                    <ShieldAlert aria-hidden="true" className="size-4" />
                  )}
                  {item.passed ? "PASSED" : "REFERRED"}
                </span>
              </div>

              {item.passed ? (
                <p className="mt-5 text-4xl font-extrabold tracking-tight text-emerald-900">
                  GPA: {item.gpa?.toFixed(2) ?? "—"}
                </p>
              ) : (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-amber-950">রেফার্ড বিষয়</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.failedSubjects.map((subject) => (
                      <span
                        className="rounded-full border border-amber-300 bg-white/70 px-3 py-1 text-sm font-semibold text-amber-950"
                        key={subject}
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-amber-950">
                    বিষয় কোডগুলো আপনার প্রবেশপত্রের সঙ্গে মিলিয়ে পরবর্তী পরীক্ষার নির্দেশনা অনুসরণ করুন।
                  </p>
                </div>
              )}

              <div className="mt-5 border-t border-black/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  পরীক্ষার নোটিশ
                </p>
                <p className="mt-1 font-medium text-slate-900">{item.notice.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  প্রকাশিত: {formatPublishDate(item.notice.publishDate)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState<"notices" | "results">("notices");

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Bangladesh Technical Education Board
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          BTEB Notice Board &amp; Result Hub
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          বোর্ডের সর্বশেষ নোটিশ দেখুন এবং প্রকাশিত পরীক্ষার ফলাফল খুঁজুন।
        </p>
      </header>

      <div aria-label="নোটিশ ও ফলাফল" className="mb-5 grid gap-2 sm:grid-cols-2" role="tablist">
        <button
          aria-selected={activeTab === "notices"}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition sm:px-5 ${
            activeTab === "notices"
              ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("notices")}
          role="tab"
          type="button"
        >
          নোটিশ বোর্ড (Live Notice Board)
        </button>
        <button
          aria-selected={activeTab === "results"}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition sm:px-5 ${
            activeTab === "results"
              ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("results")}
          role="tab"
          type="button"
        >
          বোর্ড রেজাল্ট সার্চ (Instant Result Check)
        </button>
      </div>

      {activeTab === "notices" ? <NoticeBoard /> : <ResultSearch />}
    </div>
  );
}
