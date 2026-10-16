import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Email nggak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.email("Email nggak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

export const onboardingSchema = z.object({
  schoolOrigin: z
    .string()
    .trim()
    .min(2, "Nama sekolah minimal 2 karakter")
    .max(150, "Nama sekolah maksimal 150 karakter"),
  gradeLevel: z.coerce
    .number("Pilih kelas kamu")
    .int()
    .refine((value) => [10, 11, 12].includes(value), "Pilih kelas kamu"),
  interests: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Pilih minimal satu minat")
    .max(5, "Maksimal 5 minat"),
});

export const assessmentAnswerSchema = z.object({
  questionId: z.uuid("Soal nggak valid"),
  score: z
    .number("Jawaban nggak valid")
    .int()
    .min(1, "Jawaban nggak valid")
    .max(5, "Jawaban nggak valid"),
});

export const assessmentSkipSchema = z.object({
  questionId: z.uuid("Soal nggak valid"),
});

export const gradeSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Nama mata pelajaran wajib diisi")
    .max(50, "Nama mata pelajaran maksimal 50 karakter"),
  semester: z
    .number("Semester nggak valid")
    .int()
    .min(1, "Semester nggak valid")
    .max(5, "Semester nggak valid"),
  score: z
    .number("Nilai nggak valid")
    .min(0, "Nilai minimal 0")
    .max(100, "Nilai maksimal 100"),
});

export const gradeDeleteSchema = z.object({
  subject: z.string().trim().min(1).max(50),
  semester: z.number().int().min(1).max(5),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password wajib diisi"),
  confirmation: z.string().min(1, "Ketik HAPUS untuk konfirmasi"),
});

export const paymentConfirmSchema = z.object({
  transactionId: z.uuid("Transaksi nggak valid"),
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  schoolOrigin: z
    .string()
    .trim()
    .min(2, "Nama sekolah minimal 2 karakter")
    .max(150, "Nama sekolah maksimal 150 karakter"),
  gradeLevel: z.coerce
    .number("Pilih kelas kamu")
    .int()
    .refine((value) => [10, 11, 12].includes(value), "Pilih kelas kamu"),
  interests: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "Pilih minimal satu minat")
    .max(5, "Maksimal 5 minat"),
});
