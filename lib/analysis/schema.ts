import { z } from "zod";

export function buildAnalysisSchema(majorIds: [string, ...string[]]) {
  return z.object({
    personalityType: z
      .string()
      .describe("Tipe kepribadian dominan, maksimal 50 karakter"),
    analysisSummary: z
      .string()
      .describe("Narasi hasil analisis 2 sampai 3 paragraf pendek"),
    strengths: z
      .array(z.string())
      .describe("3 sampai 5 kekuatan spesifik berdasarkan data"),
    alignmentNote: z
      .string()
      .describe(
        "Catatan keselarasan antara minat awal saat onboarding dan hasil asesmen",
      ),
    recommendations: z.array(
      z.object({
        majorId: z.enum(majorIds),
        matchPercentage: z
          .number()
          .describe("Persentase kecocokan realistis antara 40 sampai 97"),
        rankOrder: z.number().describe("Urutan rekomendasi mulai dari 1"),
        reason: z
          .string()
          .describe("Alasan 2 sampai 3 kalimat yang menyebut data spesifik"),
      }),
    ),
  });
}

export type AnalysisOutput = z.infer<ReturnType<typeof buildAnalysisSchema>>;
