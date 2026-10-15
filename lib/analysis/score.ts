export const FACTOR_WEIGHTS = {
  minat: 0.3,
  bakat: 0.25,
  nilai: 0.2,
  kepribadian: 0.15,
  gayaBelajar: 0.1,
} as const;

export type FactorKey = keyof typeof FACTOR_WEIGHTS;

export type MajorProfile = {
  riasec?: Record<string, number>;
  aptitude?: Record<string, number>;
  personality?: Record<string, number>;
  learning?: Record<string, number>;
  subjects?: Record<string, number>;
};

export type MajorScoreInput = {
  id: string;
  name: string;
  profile: MajorProfile | null;
};

export type FactorScores = {
  minat: number | null;
  bakat: number | null;
  nilai: number | null;
  kepribadian: number | null;
  gayaBelajar: number | null;
  total: number | null;
  match: number | null;
};

export type ScoredMajor = {
  majorId: string;
  name: string;
  factors: FactorScores;
};

const MATCH_MIN = 40;
const MATCH_MAX = 97;
const MIN_FACTORS_FOR_TOTAL = 2;

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function weightedAverage(
  weights: Record<string, number>,
  lookup: (key: string) => number | null,
): number | null {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (!Number.isFinite(weight) || weight <= 0) continue;
    const value = lookup(key);
    if (value === null) continue;
    weightedSum += value * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

export function scoreMajor(
  profile: MajorProfile | null,
  dimensionScores: Record<string, number | null>,
  subjectAverages: Record<string, number | null>,
): FactorScores {
  const factors: FactorScores = {
    minat: null,
    bakat: null,
    nilai: null,
    kepribadian: null,
    gayaBelajar: null,
    total: null,
    match: null,
  };
  if (!profile) return factors;

  const lookupDimension = (key: string) => dimensionScores[key] ?? null;
  const lookupSubject = (key: string) => subjectAverages[key] ?? null;

  const minat = profile.riasec
    ? weightedAverage(profile.riasec, lookupDimension)
    : null;
  const bakat = profile.aptitude
    ? weightedAverage(profile.aptitude, lookupDimension)
    : null;
  const kepribadian = profile.personality
    ? weightedAverage(profile.personality, lookupDimension)
    : null;
  const gayaBelajar = profile.learning
    ? weightedAverage(profile.learning, lookupDimension)
    : null;
  const nilai = profile.subjects
    ? weightedAverage(profile.subjects, lookupSubject)
    : null;

  factors.minat = minat === null ? null : round1(minat);
  factors.bakat = bakat === null ? null : round1(bakat);
  factors.nilai = nilai === null ? null : round1(nilai);
  factors.kepribadian = kepribadian === null ? null : round1(kepribadian);
  factors.gayaBelajar = gayaBelajar === null ? null : round1(gayaBelajar);

  const pairs: Array<[number, number | null]> = [
    [FACTOR_WEIGHTS.minat, minat],
    [FACTOR_WEIGHTS.bakat, bakat],
    [FACTOR_WEIGHTS.nilai, nilai],
    [FACTOR_WEIGHTS.kepribadian, kepribadian],
    [FACTOR_WEIGHTS.gayaBelajar, gayaBelajar],
  ];

  let available = 0;
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [weight, value] of pairs) {
    if (value === null) continue;
    available += 1;
    weightedSum += weight * value;
    weightTotal += weight;
  }
  if (available < MIN_FACTORS_FOR_TOTAL || weightTotal === 0) return factors;

  const total = weightedSum / weightTotal;
  factors.total = round1(total);
  factors.match = Math.min(
    MATCH_MAX,
    Math.max(MATCH_MIN, Math.round(MATCH_MIN + 0.57 * total)),
  );
  return factors;
}

export function scoreMajors(
  majorsInput: MajorScoreInput[],
  dimensionScores: Record<string, number | null>,
  subjectAverages: Record<string, number | null>,
): ScoredMajor[] {
  return majorsInput
    .map((major) => ({
      majorId: major.id,
      name: major.name,
      factors: scoreMajor(major.profile, dimensionScores, subjectAverages),
    }))
    .sort((a, b) => {
      const totalA = a.factors.total ?? -1;
      const totalB = b.factors.total ?? -1;
      if (totalB !== totalA) return totalB - totalA;
      return a.name.localeCompare(b.name, "id");
    });
}
