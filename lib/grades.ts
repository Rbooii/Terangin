export const MIN_SUBJECTS_PER_SEMESTER = 7;

export function defaultSemestersFor(gradeLevel: number | null): number[] {
  if (gradeLevel === 10) return [1, 2];
  if (gradeLevel === 11) return [1, 2, 3, 4];
  return [1, 2, 3, 4, 5];
}

export type SemesterCount = { semester: number; count: number };

export function getRequiredSemesters(
  defaultSemesters: number[],
  semestersWithRecords: number[],
): number[] {
  return Array.from(
    new Set([...defaultSemesters, ...semestersWithRecords]),
  ).sort((a, b) => a - b);
}

export function getSemesterShortfalls(
  requiredSemesters: number[],
  countBySemester: Map<number, number>,
): SemesterCount[] {
  return requiredSemesters
    .map((semester) => ({
      semester,
      count: countBySemester.get(semester) ?? 0,
    }))
    .filter((item) => item.count < MIN_SUBJECTS_PER_SEMESTER);
}

export function formatShortfallMessage(shortfalls: SemesterCount[]): string {
  const details = shortfalls
    .map(
      (item) =>
        `Semester ${item.semester} kurang ${MIN_SUBJECTS_PER_SEMESTER - item.count} mapel`,
    )
    .join(", ");
  return `Tiap semester minimal ${MIN_SUBJECTS_PER_SEMESTER} mata pelajaran. ${details}.`;
}
