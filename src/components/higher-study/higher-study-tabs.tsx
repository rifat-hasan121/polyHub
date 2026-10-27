"use client";

import { useState } from "react";
import {
  BookOpenCheck,
  GraduationCap,
  Landmark,
} from "lucide-react";
import { DuetHub } from "@/components/higher-study/duet-hub";
import { QuestionArchive } from "@/components/higher-study/question-archive";
import { UniversityDirectory } from "@/components/higher-study/university-directory";

const tabs = [
  {
    id: "duet",
    label: "DUET Admission Hub",
    description: "DUET নন-ডিপার্টমেন্ট ও ডিপার্টমেন্টাল প্রস্তুতি",
    icon: GraduationCap,
  },
  {
    id: "questions",
    label: "Question Bank & Solutions",
    description: "বিগত বছরের প্রশ্ন ও চ্যাপ্টার-ভিত্তিক সমাধান",
    icon: BookOpenCheck,
  },
  {
    id: "universities",
    label: "University Directory & Waivers",
    description: "প্রাইভেট ও বিদেশি বিশ্ববিদ্যালয়ে বিএসসি ও ক্রেডিট ট্রান্সফার গাইড",
    icon: Landmark,
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function HigherStudyTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("duet");

  return (
    <div>
      <div
        aria-label="Higher study resources"
        className="mb-6 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:grid-cols-3"
        role="tablist"
      >
        {tabs.map(({ id, label, description, icon: Icon }) => (
          <button
            aria-controls={`higher-study-panel-${id}`}
            aria-selected={activeTab === id}
            className={`flex min-h-20 items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
              activeTab === id
                ? "bg-cyan-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            id={`higher-study-tab-${id}`}
            key={id}
            onClick={() => setActiveTab(id)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className={`mt-1 block text-xs leading-5 ${
                activeTab === id ? "text-cyan-100" : "text-slate-500"
              }`}>
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>

      <section
        aria-labelledby={`higher-study-tab-${activeTab}`}
        id={`higher-study-panel-${activeTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeTab === "duet" ? <DuetHub /> : null}
        {activeTab === "questions" ? <QuestionArchive /> : null}
        {activeTab === "universities" ? <UniversityDirectory /> : null}
      </section>
    </div>
  );
}
