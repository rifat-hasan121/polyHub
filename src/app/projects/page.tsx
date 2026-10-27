"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Code2,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  tags: string[];
  department: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    polytechnic: string | null;
  };
};

const departments = [
  { code: "", label: "All departments" },
  { code: "CST", label: "Computer Science & Technology" },
  { code: "EEE", label: "Electrical & Electronic Engineering" },
  { code: "ET", label: "Electronics Technology" },
  { code: "ME", label: "Mechanical Technology" },
  { code: "CE", label: "Civil Technology" },
  { code: "POWER", label: "Power Technology" },
  { code: "RAC", label: "Refrigeration & Air Conditioning" },
];

const popularTags = ["Arduino", "ESP32", "React", "CAD", "Python", "IoT", "Next.js", "PLC"];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function ProjectCard({ project }: { project: Project }) {
  const safeThumbnail = project.thumbnail && /^https?:\/\//i.test(project.thumbnail)
    ? project.thumbnail
    : null;
  const safeRepoUrl = project.repoUrl && /^https?:\/\//i.test(project.repoUrl)
    ? project.repoUrl
    : null;
  const safeLiveUrl = project.liveUrl && /^https?:\/\//i.test(project.liveUrl)
    ? project.liveUrl
    : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
      {safeThumbnail ? (
        <div
          aria-label={`${project.title} project thumbnail`}
          className="h-48 bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${safeThumbnail}")` }}
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-50 via-slate-100 to-indigo-100 text-cyan-800">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-white/80 bg-white/70 shadow-sm">
            <ImageIcon aria-hidden="true" className="size-8" />
          </div>
        </div>
      )}

      <div className="flex min-h-64 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-snug text-slate-950">
            {project.title}
          </h2>
          <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
            {project.department}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {project.user.image && /^https?:\/\//i.test(project.user.image) ? (
              <span
                aria-label={project.user.name}
                className="size-9 shrink-0 rounded-full border border-slate-200 bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${project.user.image}")` }}
              />
            ) : (
              <span
                aria-label={project.user.name}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800"
                role="img"
              >
                {initials(project.user.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {project.user.name}
              </p>
              <p className="truncate text-xs text-slate-500">
                {project.user.polytechnic || "PolyHub student"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {safeRepoUrl ? (
              <a
                aria-label={`View ${project.title} source repository`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                href={safeRepoUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="Source repository"
              >
                <Code2 aria-hidden="true" className="size-5" />
              </a>
            ) : null}
            {safeLiveUrl ? (
              <a
                aria-label={`View ${project.title} live demo`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-800"
                href={safeLiveUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="Live demo"
              >
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

type ProjectFormProps = {
  onClose: () => void;
  onCreated: (project: Project) => void;
};

function ProjectForm({ onClose, onCreated }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: formData.get("title"),
      department: formData.get("department"),
      description: formData.get("description"),
      thumbnail: formData.get("thumbnail"),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      repoUrl: formData.get("repoUrl"),
      liveUrl: formData.get("liveUrl"),
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        project?: Project;
        error?: string;
      };

      if (!response.ok || !result.project) {
        throw new Error(result.error ?? "Unable to submit your project.");
      }

      onCreated(result.project);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Project submission failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="submit-project-title"
        aria-modal="true"
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950" id="submit-project-title">
              Submit a project
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Share what you have built with the PolyHub community.
            </p>
          </div>
          <button
            aria-label="Close submission form"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="project-title">
            Project title
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="project-title"
              maxLength={160}
              minLength={3}
              name="title"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="project-department">
            Department
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              defaultValue=""
              id="project-department"
              name="department"
              required
            >
              <option disabled value="">
                Select your department
              </option>
              {departments.filter((item) => item.code).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="project-description">
            Project summary
            <textarea
              className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="project-description"
              maxLength={5000}
              minLength={20}
              name="description"
              placeholder="What does it do, and how did you build it?"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="project-tags">
            Tech tags
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="project-tags"
              name="tags"
              placeholder="Arduino, IoT, Python"
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Separate tags with commas (up to 12).
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700" htmlFor="project-thumbnail">
            Thumbnail URL <span className="font-normal text-slate-400">(optional)</span>
            <input
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              id="project-thumbnail"
              name="thumbnail"
              placeholder="https://..."
              type="url"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="project-repo">
              GitHub / source URL <span className="font-normal text-slate-400">(optional)</span>
              <input
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                id="project-repo"
                name="repoUrl"
                placeholder="https://github.com/..."
                type="url"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor="project-live">
              Live demo / video URL <span className="font-normal text-slate-400">(optional)</span>
              <input
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                id="project-live"
                name="liveUrl"
                placeholder="https://..."
                type="url"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit project"
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const [department, setDepartment] = useState("");
  const [tag, setTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);

    async function loadProjects() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/projects?${params}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          projects?: Project[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load projects.");
        }
        setProjects(result.projects ?? []);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load projects right now.",
        );
        setProjects([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProjects();
    return () => controller.abort();
  }, [department, search, tag]);

  function handleCreated(project: Project) {
    setProjects((current) => [project, ...current]);
    setIsFormOpen(false);
    setSuccessMessage("Project submitted successfully.");
    window.setTimeout(() => setSuccessMessage(""), 4000);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Build · Share · Inspire
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Polytechnic Project Bank
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Explore student-built software, hardware prototypes, and capstone projects.
          </p>
        </div>
        {session?.user ? (
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
            onClick={() => setIsFormOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Submit Project
          </button>
        ) : status === "loading" ? (
          <span className="h-11 w-36 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
            href="/login"
          >
            <Plus aria-hidden="true" className="size-4" />
            Sign in to submit
          </Link>
        )}
      </header>

      {successMessage ? (
        <p
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <section
        aria-label="Filter projects"
        className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search project titles and summaries"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search project titles and summaries..."
            type="search"
            value={searchInput}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.3fr)]">
          <label className="text-sm font-medium text-slate-700">
            Department
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              {departments.map((item) => (
                <option key={item.code || "all"} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Popular tech tags
            </legend>
            <div className="flex flex-wrap gap-2">
              {["", ...popularTags].map((item) => (
                <button
                  aria-pressed={tag === item}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    tag === item
                      ? "border-cyan-700 bg-cyan-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  key={item || "all-tags"}
                  onClick={() => setTag(item)}
                  type="button"
                >
                  {item || "All tags"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <div aria-live="polite" className="mb-4 min-h-6">
        <p className="text-sm text-slate-600">
          {isLoading
            ? "Finding projects..."
            : `${projects.length} ${projects.length === 1 ? "project" : "projects"} found${projects.length === 50 ? " · showing latest 50" : ""}`}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              aria-hidden="true"
              className="h-[26rem] animate-pulse rounded-2xl border border-slate-200 bg-white"
              key={index}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <ImageIcon aria-hidden="true" className="size-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No projects found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Try a different department, tag, or search term—or be the first to share a project.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {isFormOpen ? (
        <ProjectForm
          onClose={() => setIsFormOpen(false)}
          onCreated={handleCreated}
        />
      ) : null}
    </div>
  );
}
