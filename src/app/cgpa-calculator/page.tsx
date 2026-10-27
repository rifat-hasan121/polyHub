"use client";

import { useMemo, useState } from "react";
import {
  calculateOverallCGPA,
  semesterWeights,
  type Probidhan,
} from "@/lib/bteb-grading";

const semesters = Array.from({ length: 8 }, (_, index) => index + 1);

function getGrade(cgpa: number) {
  if (cgpa >= 4) return "A+";
  if (cgpa >= 3.75) return "A";
  if (cgpa >= 3.5) return "A-";
  if (cgpa >= 3.25) return "B+";
  if (cgpa >= 3) return "B";
  if (cgpa >= 2.75) return "B-";
  if (cgpa >= 2.5) return "C+";
  if (cgpa >= 2.25) return "C";
  return "D";
}

export default function CgpaCalculatorPage() {
  const [probidhan, setProbidhan] = useState<Probidhan>("PROBIDHAN_2022");
  const [semesterInputs, setSemesterInputs] = useState<string[]>(
    Array(8).fill(""),
  );
  const result = useMemo(() => {
    const semesterGPAs: { [semester: number]: number } = {};
    semesterInputs.forEach((value, index) => {
      if (value !== "") {
        semesterGPAs[index + 1] = Number(value);
      }
    });

    try {
      return {
        ...calculateOverallCGPA(semesterGPAs, probidhan),
        error: "",
      };
    } catch (caught) {
      return {
        cgpa: 0,
        completedWeight: 0,
        error:
          caught instanceof Error
            ? caught.message
            : "Enter a valid GPA between 2.00 and 4.00.",
      };
    }
  }, [probidhan, semesterInputs]);

  function updateSemester(index: number, value: string) {
    setSemesterInputs((current) =>
      current.map((semester, currentIndex) =>
        currentIndex === index ? value : semester,
      ),
    );
  }

  function resetCalculator() {
    setSemesterInputs(Array(8).fill(""));
  }

  const hasResults = result.completedWeight > 0 && !result.error;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Academic tools
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          BTEB CGPA Calculator
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Estimate your overall CGPA using the semester weightings for your
          diploma curriculum.
        </p>
      </header>

      <section
        aria-label="Select probidhan"
        className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        {(
          [
            ["PROBIDHAN_2022", "2022 Probidhan"],
            ["PROBIDHAN_2016", "2016 Probidhan"],
          ] as const
        ).map(([value, label]) => (
          <button
            aria-pressed={probidhan === value}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              probidhan === value
                ? "bg-cyan-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            key={value}
            onClick={() => setProbidhan(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-label="Semester GPA inputs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Semester results
            </h2>
            <span className="text-sm text-slate-500">Enter GPA from 2.00 to 4.00</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {semesters.map((semester) => {
              const weight = semesterWeights[probidhan][semester - 1];
              const inputId = `semester-${semester}-gpa`;
              const value = semesterInputs[semester - 1];
              const isInvalid =
                value !== "" &&
                (!Number.isFinite(Number(value)) ||
                  Number(value) < 2 ||
                  Number(value) > 4);

              return (
                <div
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  key={semester}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      className="font-semibold text-slate-800"
                      htmlFor={inputId}
                    >
                      Semester {semester}
                    </label>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                      {weight}% weight
                    </span>
                  </div>
                  <input
                    aria-label={`Semester ${semester} GPA`}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
                    id={inputId}
                    aria-invalid={isInvalid}
                    max="4"
                    min="2"
                    onChange={(event) =>
                      updateSemester(semester - 1, event.target.value)
                    }
                    placeholder="e.g. 3.75"
                    step="0.01"
                    type="number"
                    value={value}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-slate-500">Final CGPA</p>
          <div className="mt-3 flex items-end gap-3">
            <span
              aria-live="polite"
              className="text-5xl font-bold tracking-tight text-slate-950"
            >
              {hasResults ? result.cgpa.toFixed(2) : "—"}
            </span>
            {hasResults ? (
              <span className="mb-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                Grade {getGrade(result.cgpa)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Weight accounted for{" "}
            <span className="font-semibold text-slate-900">
              {result.completedWeight}%
            </span>
          </p>
          <div
            aria-label={`${result.completedWeight}% of total weight entered`}
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={result.completedWeight}
          >
            <div
              className="h-full rounded-full bg-cyan-600 transition-all"
              style={{ width: `${result.completedWeight}%` }}
            />
          </div>
          <p className="mt-4 min-h-10 text-sm text-slate-500">
            {result.error ||
              (hasResults
                ? "Your result is based on the entered semesters and their relative weights."
                : "Enter one or more semester GPAs to see your estimated result.")}
          </p>
          <button
            className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={resetCalculator}
            type="button"
          >
            Reset calculator
          </button>
        </aside>
      </div>
    </div>
  );
}
