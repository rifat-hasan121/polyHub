"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Profile = {
  id: string;
  name: string;
  image: string | null;
  polytechnic: string | null;
  department: string | null;
  probidhan: string | null;
  semester: number | null;
  createdAt: string;
  email?: string;
};

type ProfilePost = {
  id: string;
  kind: "COMMUNITY" | "HIGHER_STUDY";
  title: string;
  content: string;
  imageUrl: string | null;
  department: string | null;
  subject?: string | null;
  year?: number | null;
  category?: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  comments: number;
  createdAt: string;
};

const categoryLabels: Record<string, string> = {
  DUET_NON_DEPT: "DUET Non-Department",
  DUET_DEPT: "DUET Department-wise",
  PRIVATE_UNI: "Private University",
  ABROAD_STUDY: "Study Abroad",
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

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(value));
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
}

export function UserProfilePage({ userId }: { userId: string }) {
  const { data: session, status: sessionStatus, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const isOwner = sessionStatus === "authenticated" && session?.user?.id === userId;

  const loadProfile = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`, { cache: "no-store" });
      const result = (await response.json()) as { profile?: Profile; posts?: ProfilePost[]; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error ?? "Unable to load this profile.");
      setProfile(result.profile);
      setPosts(result.posts ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load this profile.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/profile/${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { profile?: Profile; posts?: ProfilePost[]; error?: string };
        if (!response.ok || !result.profile) throw new Error(result.error ?? "Unable to load this profile.");
        return result;
      })
      .then((result) => {
        if (!active) return;
        setProfile(result.profile ?? null);
        setPosts(result.posts ?? []);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load this profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  async function createCommunityPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          content: data.get("content"),
          department: profile?.department ?? undefined,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to publish your post.");
      form.reset();
      setComposerOpen(false);
      await loadProfile();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish your post.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setError("");
    setProfileSuccess("");
    setSavingProfile(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          polytechnic: data.get("polytechnic"),
          department: data.get("department"),
          probidhan: data.get("probidhan"),
          semester: Number(data.get("semester")),
        }),
      });
      const result = (await response.json()) as {
        profile?: Omit<Profile, "id" | "image" | "createdAt">;
        error?: string;
      };
      if (!response.ok || !result.profile) throw new Error(result.error ?? "Unable to update your profile.");
      setProfile((current) => current ? { ...current, ...result.profile } : current);
      await update();
      setEditOpen(false);
      setProfileSuccess("Your profile has been updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return <div className="mx-auto flex min-h-96 max-w-4xl items-center justify-center gap-2 text-sm text-slate-500" role="status"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> Loading profile...</div>;
  }

  if (!profile) {
    return <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold text-slate-950">Profile not found</h1><p className="mt-2 text-sm text-slate-600">{error || "This profile may no longer be available."}</p></section>;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
      <aside className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-cyan-800 via-slate-800 to-indigo-900" />
          <div className="-mt-12 px-5 pb-5">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="size-24 rounded-full border-4 border-white bg-white object-cover" height={96} src={profile.image} width={96} />
            ) : (
              <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full border-4 border-white bg-cyan-100 text-2xl font-bold text-cyan-900">{initials(profile.name)}</span>
            )}
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{profile.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{profile.polytechnic || "PolyHub member"}</p>
            {profile.department || profile.semester || profile.probidhan ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.department ? <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{profile.department}</span> : null}
                {profile.semester ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Semester {profile.semester}</span> : null}
                {profile.probidhan ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{profile.probidhan.replace("PROBIDHAN_", "Probidhan ")}</span> : null}
              </div>
            ) : null}
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CalendarDays aria-hidden="true" className="size-4" /> Joined {formatDate(profile.createdAt)}</p>
            {isOwner ? (
              <button className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setEditOpen(true)} type="button">
                <Pencil aria-hidden="true" className="size-4" /> Edit profile
              </button>
            ) : null}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Activity</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold text-slate-950">{posts.length}</p><p className="text-xs text-slate-500">Posts</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-bold text-slate-950">{posts.reduce((total, post) => total + post.comments, 0)}</p><p className="text-xs text-slate-500">Comments</p></div>
          </div>
        </section>
      </aside>

      <main className="min-w-0">
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="size-11 rounded-full object-cover" height={44} src={profile.image} width={44} />
            ) : <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-900">{initials(profile.name)}</span>}
            {isOwner ? (
              <button className="flex min-h-11 flex-1 items-center justify-between rounded-full bg-slate-100 px-4 text-left text-sm text-slate-600 hover:bg-slate-200" onClick={() => setComposerOpen((open) => !open)} type="button">
                Share something with the community...
                <Plus aria-hidden="true" className="size-5" />
              </button>
            ) : (
              <p className="text-sm text-slate-500">Posts shared by {profile.name}</p>
            )}
          </div>
          {composerOpen && isOwner ? (
            <form className="mt-4 space-y-3 border-t border-slate-100 pt-4" onSubmit={(event) => void createCommunityPost(event)}>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-post-title">Post title
                <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" id="profile-post-title" maxLength={160} minLength={5} name="title" placeholder="What would you like to share?" required />
              </label>
              <label className="block text-sm font-medium text-slate-700" htmlFor="profile-post-content">Your post
                <textarea className="mt-1.5 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" id="profile-post-content" maxLength={10000} minLength={10} name="content" placeholder="Share an update, question, achievement, or helpful tip..." required />
              </label>
              <div className="flex justify-end gap-2">
                <button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" onClick={() => setComposerOpen(false)} type="button">Cancel</button>
                <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting} type="submit">{submitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />} Publish post</button>
              </div>
            </form>
          ) : null}
        </section>

        <div className="mb-4 flex items-center gap-2"><BookOpen aria-hidden="true" className="size-5 text-cyan-700" /><h2 className="text-xl font-bold text-slate-950">Posts</h2></div>
        {profileSuccess ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{profileSuccess}</p> : null}
        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p> : null}
        {posts.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <UserRound aria-hidden="true" className="mx-auto size-9 text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900">No posts yet</h3>
            <p className="mt-2 text-sm text-slate-500">{isOwner ? "Share an update or start a discussion from your profile." : "This member has not shared any posts yet."}</p>
          </section>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const fileUrl = safeUrl(post.fileUrl);
              const videoUrl = safeUrl(post.videoUrl);
              return (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" key={`${post.kind}-${post.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {profile.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="size-10 rounded-full object-cover" height={40} src={profile.image} width={40} />
                      ) : <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-900">{initials(profile.name)}</span>}
                      <div><p className="text-sm font-semibold text-slate-900">{profile.name}</p><p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p></div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{post.kind === "COMMUNITY" ? "Community post" : "Higher-study resource"}</span>
                  </div>
                  {post.status && post.status !== "APPROVED" ? <span className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === "PENDING" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}>{post.status === "PENDING" ? "Pending review" : "Rejected"}</span> : null}
                  {post.kind === "HIGHER_STUDY" && post.category ? <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-cyan-800">{categoryLabels[post.category] ?? post.category}{post.subject ? ` · ${post.subject}` : ""}{post.year ? ` · ${post.year}` : ""}</p> : null}
                  <h3 className="mt-3 text-lg font-bold text-slate-950">{post.title}</h3>
                  {post.content ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.content}</p> : null}
                  {post.imageUrl && safeUrl(post.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`Image shared in ${post.title}`} className="mt-4 max-h-[32rem] w-full rounded-xl object-cover" src={safeUrl(post.imageUrl) ?? ""} />
                  ) : null}
                  {fileUrl || videoUrl ? <div className="mt-4 flex flex-wrap gap-2">
                    {fileUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={fileUrl} rel="noreferrer" target="_blank">Resource <ArrowUpRight aria-hidden="true" className="size-3.5" /></a> : null}
                    {videoUrl ? <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={videoUrl} rel="noreferrer" target="_blank">Video <ArrowUpRight aria-hidden="true" className="size-3.5" /></a> : null}
                  </div> : null}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    {post.kind === "COMMUNITY" ? (
                      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800" href={`/community/${encodeURIComponent(post.id)}`}><MessageCircle aria-hidden="true" className="size-4" /> {post.comments} comments</Link>
                    ) : (
                      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cyan-800" href="/dashboard/my-higher-study"><MessageCircle aria-hidden="true" className="size-4" /> {post.comments} comments · Open community post</Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      {editOpen && isOwner ? (
        <div aria-labelledby="edit-profile-heading" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="dialog">
          <form className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onSubmit={(event) => void saveProfile(event)}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Profile settings</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950" id="edit-profile-heading">Edit your profile</h2>
              <p className="mt-1 text-sm text-slate-500">Update your name and academic details shown on your profile.</p>
            </div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-name">Full name
              <input autoComplete="name" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" defaultValue={profile.name} id="edit-profile-name" maxLength={100} minLength={2} name="name" required />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-email">Email
              <input className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500" id="edit-profile-email" readOnly value={session?.user?.email ?? ""} />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-polytechnic">Polytechnic
              <input autoComplete="organization" className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" defaultValue={profile.polytechnic ?? ""} id="edit-profile-polytechnic" maxLength={160} minLength={2} name="polytechnic" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-department">Department
                <select className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" defaultValue={profile.department ?? ""} id="edit-profile-department" name="department" required>
                  <option disabled value="">Select department</option>
                  {departments.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-probidhan">Probidhan
                <select className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" defaultValue={profile.probidhan ?? ""} id="edit-profile-probidhan" name="probidhan" required>
                  <option value="PROBIDHAN_2016">Probidhan 2016</option>
                  <option value="PROBIDHAN_2022">Probidhan 2022</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="edit-profile-semester">Current semester
              <select className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10" defaultValue={profile.semester ?? ""} id="edit-profile-semester" name="semester" required>
                <option disabled value="">Select semester</option>
                {Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}
              </select>
            </label>
            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700" disabled={savingProfile} onClick={() => setEditOpen(false)} type="button">Cancel</button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={savingProfile} type="submit">
                {savingProfile ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
                Save profile
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
