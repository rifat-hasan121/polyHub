export type Probidhan = "PROBIDHAN_2016" | "PROBIDHAN_2022";

export const semesterWeights: Record<Probidhan, readonly number[]> = {
  PROBIDHAN_2016: [5, 5, 5, 10, 15, 20, 25, 15],
  PROBIDHAN_2022: [5, 5, 5, 10, 15, 20, 25, 15],
};

export function calculateOverallCGPA(
  semesterGPAs: { [semester: number]: number },
  probidhan: Probidhan,
): { cgpa: number; completedWeight: number } {
  const weights = semesterWeights[probidhan];
  let weightedPoints = 0;
  let completedWeight = 0;

  for (const [semesterInput, gpa] of Object.entries(semesterGPAs)) {
    const semester = Number(semesterInput);

    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      throw new RangeError(`Invalid semester: ${semesterInput}`);
    }

    if (!Number.isFinite(gpa)) {
      throw new RangeError(`Semester ${semester} GPA must be a finite number.`);
    }

    if (gpa === 0) {
      continue;
    }

    if (gpa < 2 || gpa > 4) {
      throw new RangeError(`Semester ${semester} GPA must be between 2.00 and 4.00.`);
    }

    const weight = weights[semester - 1];
    weightedPoints += gpa * weight;
    completedWeight += weight;
  }

  return {
    cgpa: completedWeight === 0 ? 0 : weightedPoints / completedWeight,
    completedWeight,
  };
}
