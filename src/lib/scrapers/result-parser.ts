import pdfParse from "pdf-parse";

export type BtebResult = {
  roll: string;
  gpa: number | null;
  passed: boolean;
  failedSubjects: string[];
};

const passedRollPattern = /(\d{6})\s*\((\d+(?:\.\d+)?)\)/g;
const failedRollPattern = /(\d{6})\s*\{([^}]+)\}/g;
const subjectCodePattern = /\b\d{5,8}\b/g;

export function parseBTEBResultText(text: string): BtebResult[] {
  const results = new Map<string, BtebResult>();

  for (const match of text.matchAll(passedRollPattern)) {
    const [, roll, rawGpa] = match;
    const gpa = Number(rawGpa);
    if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4) continue;

    if (!results.has(roll)) {
      results.set(roll, {
        roll,
        gpa,
        passed: true,
        failedSubjects: [],
      });
    }
  }

  for (const match of text.matchAll(failedRollPattern)) {
    const [, roll, subjectsText] = match;
    const failedSubjects = [
      ...new Set(subjectsText.match(subjectCodePattern) ?? []),
    ];
    if (failedSubjects.length === 0) continue;

    results.set(roll, {
      roll,
      gpa: null,
      passed: false,
      failedSubjects,
    });
  }

  return [...results.values()];
}

export async function parseBTEBResultPdf(
  pdfBuffer: Buffer,
): Promise<BtebResult[]> {
  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new TypeError("A non-empty PDF buffer is required.");
  }

  const parsedPdf = await pdfParse(pdfBuffer);
  return parseBTEBResultText(parsedPdf.text);
}
