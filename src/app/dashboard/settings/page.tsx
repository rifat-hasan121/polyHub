"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  polytechnic: string | null;
  department: string | null;
  probidhan: "PROBIDHAN_2016" | "PROBIDHAN_2022" | null;
  semester: number | null;
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

export default function ProfileSettingsPage() {
  const { status, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      return;
    }

    const controller = new AbortController();
    async function loadProfile() {
      setError("");
      try {
        const response = await fetch("/api/user/profile", { signal: controller.signal });
        const result = (await response.json()) as { profile?: Profile; error?: string };
        if (!response.ok || !result.profile) {
          throw new Error(result.error ?? "Unable to load your profile.");
        }
        setProfile(result.profile);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Unable to load your profile.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setError("");
    setSuccess("");
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      polytechnic: formData.get("polytechnic"),
      department: formData.get("department"),
      probidhan: formData.get("probidhan"),
      semester: Number(formData.get("semester")),
    };

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { profile?: Profile; error?: string };
      if (!response.ok || !result.profile) {
        throw new Error(result.error ?? "Unable to update your profile.");
      }

      setProfile(result.profile);
      await update();
      setSuccess("Your profile has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Sign in to manage your profile</h1>
        <Link className="mt-4 inline-flex rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white" href="/login?callbackUrl=%2Fdashboard%2Fsettings">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800" href="/dashboard">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to dashboard
      </Link>
      <header className="mb-6 mt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Your account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Profile settings
        </h1>
        <p className="mt-2 text-slate-600">
          Keep your academic details current for personalized resources and recommendations.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {isLoading ? (
          <div aria-label="Loading profile" className="space-y-4" role="status">
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : profile ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-name">
              Full name
              <input
                autoComplete="name"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                id="profile-name"
                maxLength={100}
                minLength={2}
                name="name"
                required
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-email">
              Email
              <input
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500"
                id="profile-email"
                readOnly
                value={profile.email}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Email address cannot be changed here.
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-polytechnic">
              Polytechnic name
              <input
                autoComplete="organization"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                id="profile-polytechnic"
                maxLength={160}
                minLength={2}
                name="polytechnic"
                placeholder="Mymensingh Polytechnic Institute"
                required
                value={profile.polytechnic ?? ""}
                onChange={(event) => setProfile({ ...profile, polytechnic: event.target.value })}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-department">
                Department
                <select
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                  id="profile-department"
                  name="department"
                  required
                  value={profile.department ?? ""}
                  onChange={(event) => setProfile({ ...profile, department: event.target.value })}
                >
                  <option disabled value="">
                    Select department
                  </option>
                  {departments.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-probidhan">
                Probidhan
                <select
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                  id="profile-probidhan"
                  name="probidhan"
                  required
                  value={profile.probidhan ?? ""}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      probidhan: event.target.value as Profile["probidhan"],
                    })
                  }
                >
                  <option disabled value="">
                    Select probidhan
                  </option>
                  <option value="PROBIDHAN_2016">Probidhan 2016</option>
                  <option value="PROBIDHAN_2022">Probidhan 2022</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700" htmlFor="profile-semester">
              Current semester
              <select
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                id="profile-semester"
                name="semester"
                required
                value={profile.semester ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    semester: event.target.value ? Number(event.target.value) : null,
                  })
                }
              >
                <option disabled value="">
                  Select semester
                </option>
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Semester {index + 1}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
                {success}
              </p>
            ) : null}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="size-4" />
                )}
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error || "Unable to load your profile."}
          </div>
        )}
      </section>
    </div>
  );
}
