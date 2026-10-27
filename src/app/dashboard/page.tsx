import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  GraduationCap,
  MessageSquare,
  FolderKanban,
  Settings,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const departmentNames: Record<string, string> = {
  CST: "Computer Science & Technology",
  CE: "Civil Technology",
  EEE: "Electrical & Electronic Engineering",
  ME: "Mechanical Technology",
  POWER: "Power Technology",
  ET: "Electronics Technology",
  RAC: "Refrigeration & Air Conditioning",
};

function formatProbidhan(probidhan: string | null) {
  return probidhan === "PROBIDHAN_2016" ? "Probidhan 2016" : "Probidhan 2022";
}

async function DashboardContent() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fdashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      polytechnic: true,
      department: true,
      probidhan: true,
      semester: true,
      _count: {
        select: {
          savedMaterials: true,
          projects: true,
          communityPosts: true,
        },
      },
    },
  });
  if (!user) redirect("/login");

  const recommendedAttachments = user.department
    ? await prisma.opportunity.findMany({
        where: {
          type: "INDUSTRIAL_ATTACHMENT",
          department: { has: user.department },
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          companyName: true,
          location: true,
          deadline: true,
        },
      })
    : [];
  const department = user.department ?? "";
  const materialsUrl = department
    ? `/materials?department=${encodeURIComponent(department)}&probidhan=${user.probidhan ?? "PROBIDHAN_2022"}`
    : "/materials";
  const cgpaUrl = `/cgpa-calculator?probidhan=${user.probidhan ?? "PROBIDHAN_2022"}`;
  const displayName = user.name?.trim() || session.user.name || "Student";

  const stats = [
    {
      label: "Saved materials",
      value: user._count.savedMaterials,
      description: "Bookmarks for your study list",
      href: "/materials",
      icon: BookMarked,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Submitted projects",
      value: user._count.projects,
      description: "Projects in the showcase",
      href: "/projects",
      icon: FolderKanban,
      color: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Discussions",
      value: user._count.communityPosts,
      description: "Questions and posts shared",
      href: "/community",
      icon: MessageSquare,
      color: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Student dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Your learning resources, project showcase, and community activity in one place.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            href="/dashboard/settings"
          >
            <Settings aria-hidden="true" className="size-4" />
            Profile settings
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
            <GraduationCap aria-hidden="true" className="size-4 text-cyan-300" />
            {departmentNames[department] ?? (department || "Department not set")}
          </span>
          {user.semester ? (
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
              Semester {user.semester}
            </span>
          ) : null}
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
            {formatProbidhan(user.probidhan)}
          </span>
          {user.polytechnic ? (
            <span className="rounded-full bg-cyan-300/15 px-3 py-1.5 text-sm font-medium text-cyan-100">
              {user.polytechnic}
            </span>
          ) : (
            <Link
              className="rounded-full bg-amber-300/15 px-3 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-300/25"
              href="/dashboard/settings"
            >
              Add your polytechnic
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Your activity" className="mt-7 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, description, href, icon: Icon, color }) => (
          <Link
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
            href={href}
            key={label}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex size-11 items-center justify-center rounded-xl ${color}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="text-3xl font-bold tracking-tight text-slate-950">{value}</span>
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
              Made for your studies
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Quick access</h2>
          </div>
          <div className="space-y-3">
            <Link
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/50"
              href={materialsUrl}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <BookOpen aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    My Department Syllabus &amp; Books
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {departmentNames[department] ?? "Browse all departments"}
                  </span>
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/50"
              href={cgpaUrl}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Calculator aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">CGPA Calculator</span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    Set up for {formatProbidhan(user.probidhan)}
                  </span>
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            </Link>
            <Link
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/50"
              href={department ? `/jobs?type=INDUSTRIAL_ATTACHMENT&department=${encodeURIComponent(department)}` : "/jobs"}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <BriefcaseBusiness aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Industrial Attachments
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {department ? `Recommended for ${department}` : "Explore current placements"}
                  </span>
                </span>
              </span>
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Matched to {department || "you"}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">Recommended attachments</h2>
            </div>
            <Link className="text-sm font-semibold text-cyan-800 hover:underline" href="/jobs">
              View all
            </Link>
          </div>
          {recommendedAttachments.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recommendedAttachments.map((opportunity) => (
                <li className="py-3 first:pt-0 last:pb-0" key={opportunity.id}>
                  <Link className="group block" href="/jobs">
                    <span className="block font-semibold text-slate-800 group-hover:text-cyan-800">
                      {opportunity.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {opportunity.companyName} · {opportunity.location}
                    </span>
                    {opportunity.deadline ? (
                      <span className="mt-1 block text-xs text-slate-400">
                        Deadline{" "}
                        {new Intl.DateTimeFormat("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(opportunity.deadline)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                {department ? "No matching attachments yet." : "Add your department to get recommendations."}
              </p>
              <Link
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800 hover:underline"
                href={department ? "/jobs" : "/dashboard/settings"}
              >
                {department ? "Explore all opportunities" : "Complete your profile"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-2xl bg-white" />}>
      <DashboardContent />
    </Suspense>
  );
}
