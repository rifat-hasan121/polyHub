"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileQuestion,
  MapPin,
  Search,
} from "lucide-react";
import type { JobType } from "@prisma/client";

type Opportunity = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  type: JobType;
  description: string;
  applyUrl: string | null;
  department: string[];
  deadline: string | null;
  createdAt: string;
};

const departments = [
  { code: "CST", label: "Computer Science & Technology" },
  { code: "CE", label: "Civil Technology" },
  { code: "EEE", label: "Electrical & Electronic Engineering" },
  { code: "ME", label: "Mechanical Technology" },
  { code: "POWER", label: "Power Technology" },
  { code: "ET", label: "Electronics Technology" },
  { code: "RAC", label: "Refrigeration & Air Conditioning" },
];

const locations = [
  "Dhaka",
  "Chattogram",
  "Mymensingh",
  "Rajshahi",
  "Khulna",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Remote",
];

const typeLabels: Record<JobType, string> = {
  INDUSTRIAL_ATTACHMENT: "Industrial Attachment",
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
};

function formatDeadline(deadline: string | null) {
  if (!deadline) return "No deadline specified";

  const date = new Date(deadline);
  const formattedDate = new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const remaining = date.getTime() - Date.now();

  if (remaining < 0) return `Closed · ${formattedDate}`;
  const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  if (days === 0) return `Closes today · ${formattedDate}`;
  if (days === 1) return `1 day left · ${formattedDate}`;
  return `${days} days left · ${formattedDate}`;
}

function isExpired(deadline: string | null) {
  return deadline !== null && new Date(deadline).getTime() < Date.now();
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const expired = isExpired(opportunity.deadline);
  const safeApplyUrl = opportunity.applyUrl && /^https?:\/\//i.test(opportunity.applyUrl)
    ? opportunity.applyUrl
    : null;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <BriefcaseBusiness aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-500">
              {opportunity.companyName}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold leading-snug text-slate-950">
              {opportunity.title}
            </h2>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            opportunity.type === "INDUSTRIAL_ATTACHMENT"
              ? "bg-emerald-100 text-emerald-800"
              : opportunity.type === "FULL_TIME"
                ? "bg-blue-100 text-blue-800"
                : "bg-violet-100 text-violet-800"
          }`}
        >
          {typeLabels[opportunity.type]}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-4 text-slate-400" />
          {opportunity.location}
        </span>
        <span className={`inline-flex items-center gap-1.5 ${expired ? "text-red-700" : ""}`}>
          <CalendarDays aria-hidden="true" className="size-4" />
          {formatDeadline(opportunity.deadline)}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
        {opportunity.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {opportunity.department.map((code) => (
          <span
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
            key={code}
          >
            {code}
          </span>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        {safeApplyUrl && !expired ? (
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
            href={safeApplyUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Apply Now / Details
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        ) : (
          <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
            {expired ? "Applications closed" : "Application link unavailable"}
          </span>
        )}
      </div>
    </article>
  );
}

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<"attachment" | "jobs">("attachment");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    const types: JobType[] =
      activeTab === "attachment"
        ? ["INDUSTRIAL_ATTACHMENT"]
        : ["FULL_TIME", "PART_TIME"];
    types.forEach((type) => params.append("type", type));
    selectedDepartments.forEach((department) => params.append("department", department));
    if (location) params.set("location", location);
    if (search) params.set("search", search);

    async function loadOpportunities() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/opportunities?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          opportunities?: Opportunity[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load opportunities.");
        }
        setOpportunities(result.opportunities ?? []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load opportunities right now.",
        );
        setOpportunities([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadOpportunities();
    return () => controller.abort();
  }, [activeTab, location, search, selectedDepartments]);

  function toggleDepartment(code: string) {
    setSelectedDepartments((selected) =>
      selected.includes(code)
        ? selected.filter((item) => item !== code)
        : [...selected, code],
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Build your career
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Industrial Attachments &amp; Entry-Level Jobs
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Find industrial placements for your final semester or your first engineering role.
        </p>
      </header>

      <div aria-label="Opportunity category" className="mb-6 grid gap-2 sm:grid-cols-2" role="tablist">
        <button
          aria-selected={activeTab === "attachment"}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition sm:px-5 ${
            activeTab === "attachment"
              ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("attachment")}
          role="tab"
          type="button"
        >
          Industrial Attachments (৮ম সেমিস্টার ইন্টার্নশিপ)
        </button>
        <button
          aria-selected={activeTab === "jobs"}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition sm:px-5 ${
            activeTab === "jobs"
              ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          onClick={() => setActiveTab("jobs")}
          role="tab"
          type="button"
        >
          Entry-Level Engineering Jobs (চাকরি)
        </button>
      </div>

      <section
        aria-label="Filter opportunities"
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search company or role"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search company or role..."
            type="search"
            value={searchInput}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_15rem]">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Department
            </legend>
            <div className="flex flex-wrap gap-2">
              {departments.map(({ code, label }) => {
                const checked = selectedDepartments.includes(code);
                return (
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                      checked
                        ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    key={code}
                    title={label}
                  >
                    <input
                      checked={checked}
                      className="accent-cyan-700"
                      onChange={() => toggleDepartment(code)}
                      type="checkbox"
                    />
                    {code}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="text-sm font-medium text-slate-700">
            City / Location
            <select
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setLocation(event.target.value)}
              value={location}
            >
              <option value="">All locations</option>
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedDepartments.length > 0 ? (
          <button
            className="mt-3 text-xs font-semibold text-cyan-800 hover:underline"
            onClick={() => setSelectedDepartments([])}
            type="button"
          >
            Clear department filters
          </button>
        ) : null}
      </section>

      <div aria-live="polite" className="mb-4 min-h-6">
        <p className="text-sm text-slate-600">
          {isLoading
            ? "Finding opportunities..."
            : `${opportunities.length} ${opportunities.length === 1 ? "opportunity" : "opportunities"} found${opportunities.length === 50 ? " · showing latest 50" : ""}`}
        </p>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              aria-hidden="true"
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              key={index}
            />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <FileQuestion aria-hidden="true" className="size-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No opportunities found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try changing your department, location, or search. Check back soon for new openings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  );
}
