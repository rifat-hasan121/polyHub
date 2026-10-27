import type { Metadata } from "next";
import { BookOpenCheck, GraduationCap, Sparkles } from "lucide-react";
import { HigherStudyTabs } from "@/components/higher-study/higher-study-tabs";

export const metadata: Metadata = {
  title: "Higher Study & DUET Admission",
  description:
    "ডিপ্লোমা শিক্ষার্থীদের জন্য DUET ভর্তি প্রস্তুতি, বিগত বছরের প্রশ্ন, সমাধান এবং বিশ্ববিদ্যালয়ের ক্রেডিট ওয়েভার তথ্য।",
};

export default function HigherStudyPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 px-6 py-9 text-white shadow-sm sm:px-9 sm:py-12">
        <div aria-hidden="true" className="absolute -right-14 -top-20 -z-10 size-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-28 left-1/3 -z-10 size-64 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-100">
            <Sparkles aria-hidden="true" className="size-3.5" />
            POLYHUB HIGHER STUDY CORNER
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            ডিপ্লোমা পরবর্তী উচ্চশিক্ষা ও ডুয়েট অ্যাডমিশন কর্নার
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            পরিকল্পিত প্রস্তুতির জন্য বিষয়ভিত্তিক নোট ও লেকচার দেখুন, বিগত বছরের প্রশ্ন অনুশীলন করুন এবং ডিপ্লোমা গ্র্যাজুয়েটদের জন্য বিশ্ববিদ্যালয়ের ভর্তি ও ক্রেডিট ওয়েভার তথ্য যাচাই করুন।
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-slate-100">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <GraduationCap aria-hidden="true" className="size-4 text-cyan-200" />
              DUET ভর্তি প্রস্তুতি
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <BookOpenCheck aria-hidden="true" className="size-4 text-cyan-200" />
              প্রশ্ন ও সমাধান
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <HigherStudyTabs />
      </div>
    </div>
  );
}
