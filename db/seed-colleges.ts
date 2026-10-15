import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { MajorProfile } from "../lib/analysis/score";
import { majors, universities, universityMajors } from "./schema";

type SeedMajor = {
  name: string;
  description: string;
  careerProspects: string;
  profile: MajorProfile;
};

type SeedUniversity = {
  name: string;
  type: "PTN" | "PTS" | "KEDINASAN" | "PTLN";
  location: string;
};

type SeedCampusMajor = {
  university: string;
  major: string;
  capacity: number;
  estimatedTuition: string;
};

const MAJORS: SeedMajor[] = [
  {
    name: "Teknik Informatika",
    description:
      "Belajar membangun perangkat lunak, algoritma, kecerdasan buatan, dan sistem komputasi.",
    careerProspects:
      "Software engineer, data scientist, AI engineer, product developer, startup founder.",
    profile: {
      riasec: { I: 0.7, C: 0.2, R: 0.1 },
      aptitude: { numerik: 0.35, data: 0.25, mekanikal: 0.2, verbal: 0.1, memori: 0.1 },
      personality: { rasional: 0.4, terencana: 0.3, tangguh: 0.3 },
      learning: { mandiri: 0.4, praktik: 0.3, latihan: 0.3 },
      subjects: { Matematika: 0.4, Informatika: 0.25, Fisika: 0.2, "Bahasa Inggris": 0.15 },
    },
  },
  {
    name: "Sistem Informasi",
    description:
      "Menggabungkan teknologi dan proses bisnis: merancang sistem informasi yang dipakai organisasi.",
    careerProspects:
      "Business analyst, konsultan sistem, product manager, UI/UX researcher, IT auditor.",
    profile: {
      riasec: { I: 0.5, E: 0.25, C: 0.25 },
      aptitude: { data: 0.35, numerik: 0.25, verbal: 0.2, memori: 0.2 },
      personality: { kolaboratif: 0.35, terencana: 0.35, rasional: 0.3 },
      learning: { praktik: 0.35, mandiri: 0.35, diskusi: 0.3 },
      subjects: { Matematika: 0.3, Informatika: 0.25, "Bahasa Inggris": 0.25, Ekonomi: 0.2 },
    },
  },
  {
    name: "Teknik Elektro",
    description:
      "Mempelajari listrik, elektronika, kontrol, telekomunikasi, dan energi terbarukan.",
    careerProspects:
      "Electrical engineer, IoT engineer, energy analyst, automation specialist.",
    profile: {
      riasec: { I: 0.5, R: 0.4, C: 0.1 },
      aptitude: { mekanikal: 0.35, numerik: 0.3, spasial: 0.2, memori: 0.15 },
      personality: { tangguh: 0.35, terencana: 0.35, rasional: 0.3 },
      learning: { praktik: 0.45, mandiri: 0.3, latihan: 0.25 },
      subjects: { Fisika: 0.4, Matematika: 0.35, Informatika: 0.15, Kimia: 0.1 },
    },
  },
  {
    name: "Kedokteran",
    description:
      "Ilmu kesehatan untuk mendiagnosis, merawat, dan mencegah penyakit pada manusia.",
    careerProspects:
      "Dokter umum, dokter spesialis, peneliti medis, dokter komunitas.",
    profile: {
      riasec: { I: 0.6, S: 0.3, R: 0.1 },
      aptitude: { memori: 0.3, verbal: 0.25, data: 0.25, numerik: 0.2 },
      personality: { tangguh: 0.35, rasional: 0.35, terencana: 0.3 },
      learning: { latihan: 0.35, mandiri: 0.35, visual: 0.15, auditori: 0.15 },
      subjects: { Biologi: 0.35, Kimia: 0.3, Matematika: 0.2, "Bahasa Inggris": 0.15 },
    },
  },
  {
    name: "Keperawatan",
    description:
      "Merawat pasien secara holistik: fisik, mental, dan sosial, di berbagai layanan kesehatan.",
    careerProspects:
      "Perawat klinis, perawat komunitas, manajer layanan kesehatan, pendidik keperawatan.",
    profile: {
      riasec: { S: 0.6, I: 0.25, R: 0.15 },
      aptitude: { memori: 0.3, verbal: 0.3, data: 0.2, numerik: 0.2 },
      personality: { tangguh: 0.4, sosial: 0.3, kolaboratif: 0.3 },
      learning: { praktik: 0.4, latihan: 0.3, diskusi: 0.3 },
      subjects: { Biologi: 0.35, Kimia: 0.25, Matematika: 0.2, "Bahasa Inggris": 0.2 },
    },
  },
  {
    name: "Psikologi",
    description:
      "Memahami perilaku dan proses mental manusia, termasuk asesmen dan pendampingan.",
    careerProspects:
      "Psikolog klinis, HR specialist, konselor, peneliti perilaku, UX researcher.",
    profile: {
      riasec: { S: 0.55, I: 0.35, A: 0.1 },
      aptitude: { verbal: 0.35, data: 0.3, memori: 0.2, numerik: 0.15 },
      personality: { rasional: 0.35, kolaboratif: 0.35, sosial: 0.3 },
      learning: { mandiri: 0.35, diskusi: 0.35, auditori: 0.3 },
      subjects: { Sosiologi: 0.3, Biologi: 0.25, "Bahasa Indonesia": 0.25, Matematika: 0.2 },
    },
  },
  {
    name: "Manajemen",
    description:
      "Mengelola organisasi: strategi, pemasaran, operasional, sumber daya manusia, dan keuangan.",
    careerProspects:
      "Business development, konsultan manajemen, entrepreneur, product manager.",
    profile: {
      riasec: { E: 0.55, C: 0.3, S: 0.15 },
      aptitude: { verbal: 0.3, data: 0.3, numerik: 0.25, memori: 0.15 },
      personality: { pemberani: 0.35, kolaboratif: 0.35, terencana: 0.3 },
      learning: { diskusi: 0.4, praktik: 0.3, mandiri: 0.3 },
      subjects: { Ekonomi: 0.35, Matematika: 0.25, "Bahasa Indonesia": 0.2, "Bahasa Inggris": 0.2 },
    },
  },
  {
    name: "Akuntansi",
    description:
      "Menyusun, menganalisis, dan mengaudit laporan keuangan serta perpajakan.",
    careerProspects:
      "Akuntan publik, auditor, analis keuangan, konsultan pajak, controller.",
    profile: {
      riasec: { C: 0.6, E: 0.2, I: 0.2 },
      aptitude: { numerik: 0.4, data: 0.3, memori: 0.2, verbal: 0.1 },
      personality: { terencana: 0.4, rasional: 0.35, tangguh: 0.25 },
      learning: { latihan: 0.4, mandiri: 0.35, auditori: 0.25 },
      subjects: { Ekonomi: 0.35, Matematika: 0.35, "Bahasa Indonesia": 0.15, "Bahasa Inggris": 0.15 },
    },
  },
  {
    name: "Ilmu Hukum",
    description:
      "Mempelajari aturan hukum, keadilan, dan penerapannya di masyarakat dan bisnis.",
    careerProspects:
      "Advokat, notaris, hakim/jaksa, legal counsel, analis kebijakan.",
    profile: {
      riasec: { E: 0.4, S: 0.3, I: 0.3 },
      aptitude: { verbal: 0.45, memori: 0.25, data: 0.2, numerik: 0.1 },
      personality: { rasional: 0.4, pemberani: 0.3, tangguh: 0.3 },
      learning: { diskusi: 0.4, mandiri: 0.35, auditori: 0.25 },
      subjects: { PPKn: 0.3, "Bahasa Indonesia": 0.3, Sosiologi: 0.25, "Bahasa Inggris": 0.15 },
    },
  },
  {
    name: "Ilmu Komunikasi",
    description:
      "Strategi komunikasi, media, periklanan, jurnalistik, dan hubungan masyarakat.",
    careerProspects:
      "PR officer, content strategist, jurnalis, social media specialist, copywriter.",
    profile: {
      riasec: { A: 0.4, S: 0.35, E: 0.25 },
      aptitude: { verbal: 0.45, data: 0.2, memori: 0.2, numerik: 0.15 },
      personality: { sosial: 0.4, pemberani: 0.3, kolaboratif: 0.3 },
      learning: { diskusi: 0.45, auditori: 0.3, visual: 0.25 },
      subjects: { "Bahasa Indonesia": 0.35, "Bahasa Inggris": 0.3, Sosiologi: 0.2, PPKn: 0.15 },
    },
  },
  {
    name: "Desain Komunikasi Visual",
    description:
      "Merancang pesan visual: desain grafis, ilustrasi, branding, dan media digital.",
    careerProspects:
      "Graphic designer, brand designer, illustrator, motion designer, art director.",
    profile: {
      riasec: { A: 0.75, S: 0.15, E: 0.1 },
      aptitude: { spasial: 0.4, memori: 0.25, verbal: 0.2, data: 0.15 },
      personality: { pemberani: 0.4, tangguh: 0.35, sosial: 0.25 },
      learning: { visual: 0.5, praktik: 0.3, mandiri: 0.2 },
      subjects: { "Bahasa Indonesia": 0.3, "Bahasa Inggris": 0.25, Informatika: 0.25, Sosiologi: 0.2 },
    },
  },
  {
    name: "Sastra Inggris",
    description:
      "Mendalami bahasa, sastra, dan budaya Inggris serta penerjemahan.",
    careerProspects:
      "Penerjemah, editor, content writer, dosen, diplomat, spesialis komunikasi global.",
    profile: {
      riasec: { A: 0.5, S: 0.3, I: 0.2 },
      aptitude: { verbal: 0.55, memori: 0.2, data: 0.15, numerik: 0.1 },
      personality: { kolaboratif: 0.4, rasional: 0.3, terencana: 0.3 },
      learning: { diskusi: 0.35, mandiri: 0.35, auditori: 0.3 },
      subjects: { "Bahasa Inggris": 0.45, "Bahasa Indonesia": 0.3, Sosiologi: 0.15, Sejarah: 0.1 },
    },
  },
];

const UNIVERSITIES: SeedUniversity[] = [
  { name: "Universitas Indonesia", type: "PTN", location: "Depok" },
  { name: "Institut Teknologi Bandung", type: "PTN", location: "Bandung" },
  { name: "Universitas Gadjah Mada", type: "PTN", location: "Yogyakarta" },
  { name: "Institut Pertanian Bogor", type: "PTN", location: "Bogor" },
  { name: "Universitas Padjadjaran", type: "PTN", location: "Bandung" },
  { name: "Institut Teknologi Sepuluh Nopember", type: "PTN", location: "Surabaya" },
  { name: "Universitas Airlangga", type: "PTN", location: "Surabaya" },
  { name: "Universitas Diponegoro", type: "PTN", location: "Semarang" },
  { name: "Bina Nusantara", type: "PTS", location: "Jakarta" },
  { name: "Telkom University", type: "PTS", location: "Bandung" },
];

const CAMPUS_MAJORS: SeedCampusMajor[] = [
  { university: "Universitas Indonesia", major: "Teknik Informatika", capacity: 70, estimatedTuition: "8500000.00" },
  { university: "Universitas Indonesia", major: "Sistem Informasi", capacity: 55, estimatedTuition: "8500000.00" },
  { university: "Universitas Indonesia", major: "Psikologi", capacity: 85, estimatedTuition: "7000000.00" },
  { university: "Universitas Indonesia", major: "Ilmu Hukum", capacity: 100, estimatedTuition: "6500000.00" },
  { university: "Universitas Indonesia", major: "Ilmu Komunikasi", capacity: 60, estimatedTuition: "7000000.00" },
  { university: "Institut Teknologi Bandung", major: "Teknik Informatika", capacity: 85, estimatedTuition: "10000000.00" },
  { university: "Institut Teknologi Bandung", major: "Teknik Elektro", capacity: 75, estimatedTuition: "10000000.00" },
  { university: "Universitas Gadjah Mada", major: "Kedokteran", capacity: 60, estimatedTuition: "12000000.00" },
  { university: "Universitas Gadjah Mada", major: "Psikologi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Gadjah Mada", major: "Manajemen", capacity: 95, estimatedTuition: "7500000.00" },
  { university: "Universitas Gadjah Mada", major: "Ilmu Hukum", capacity: 110, estimatedTuition: "6500000.00" },
  { university: "Institut Pertanian Bogor", major: "Manajemen", capacity: 50, estimatedTuition: "5500000.00" },
  { university: "Universitas Padjadjaran", major: "Ilmu Hukum", capacity: 100, estimatedTuition: "7000000.00" },
  { university: "Universitas Padjadjaran", major: "Psikologi", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Padjadjaran", major: "Ilmu Komunikasi", capacity: 90, estimatedTuition: "6500000.00" },
  { university: "Universitas Padjadjaran", major: "Akuntansi", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Teknik Informatika", capacity: 90, estimatedTuition: "8000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Sistem Informasi", capacity: 60, estimatedTuition: "8000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Teknik Elektro", capacity: 75, estimatedTuition: "8000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Desain Komunikasi Visual", capacity: 50, estimatedTuition: "8000000.00" },
  { university: "Universitas Airlangga", major: "Kedokteran", capacity: 75, estimatedTuition: "15000000.00" },
  { university: "Universitas Airlangga", major: "Keperawatan", capacity: 90, estimatedTuition: "7000000.00" },
  { university: "Universitas Airlangga", major: "Psikologi", capacity: 80, estimatedTuition: "7500000.00" },
  { university: "Universitas Airlangga", major: "Akuntansi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Kedokteran", capacity: 70, estimatedTuition: "12000000.00" },
  { university: "Universitas Diponegoro", major: "Teknik Informatika", capacity: 75, estimatedTuition: "8000000.00" },
  { university: "Universitas Diponegoro", major: "Ilmu Hukum", capacity: 110, estimatedTuition: "6500000.00" },
  { university: "Universitas Diponegoro", major: "Manajemen", capacity: 95, estimatedTuition: "7000000.00" },
  { university: "Bina Nusantara", major: "Teknik Informatika", capacity: 250, estimatedTuition: "25000000.00" },
  { university: "Bina Nusantara", major: "Sistem Informasi", capacity: 220, estimatedTuition: "24000000.00" },
  { university: "Bina Nusantara", major: "Desain Komunikasi Visual", capacity: 150, estimatedTuition: "22000000.00" },
  { university: "Telkom University", major: "Teknik Informatika", capacity: 300, estimatedTuition: "18000000.00" },
  { university: "Telkom University", major: "Sistem Informasi", capacity: 250, estimatedTuition: "17000000.00" },
  { university: "Telkom University", major: "Ilmu Komunikasi", capacity: 150, estimatedTuition: "15000000.00" },
];

async function main() {
  const force = process.argv.includes("--force");
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(majors);

  if (existing.count > 0 && !force) {
    // Jalur aman: jangan hapus apa pun, cukup terapkan profil skoring
    // berdasarkan kecocokan nama (idempotent, relasi kampus tidak tersentuh).
    console.log(
      `Data jurusan sudah terisi (${existing.count} jurusan). Menerapkan profil skoring...`,
    );
    let updated = 0;
    for (const major of MAJORS) {
      const result = await db
        .update(majors)
        .set({ profile: major.profile })
        .where(eq(majors.name, major.name))
        .returning({ id: majors.id });
      updated += result.length;
    }
    console.log(`Profil skoring diperbarui untuk ${updated} jurusan.`);
    await client.end();
    return;
  }

  if (force && existing.count > 0) {
    console.warn(
      "Peringatan: --force menghapus jurusan, kampus, relasi kampus-jurusan, dan rekomendasi analisis (cascade).",
    );
    await db.delete(universityMajors);
    await db.delete(majors);
    await db.delete(universities);
  }

  const insertedMajors = await db
    .insert(majors)
    .values(MAJORS)
    .returning({ id: majors.id, name: majors.name });
  const insertedUniversities = await db
    .insert(universities)
    .values(UNIVERSITIES)
    .returning({ id: universities.id, name: universities.name });

  const majorByName = new Map(insertedMajors.map((m) => [m.name, m.id]));
  const universityByName = new Map(
    insertedUniversities.map((u) => [u.name, u.id]),
  );

  const relations = CAMPUS_MAJORS.map((item) => {
    const universityId = universityByName.get(item.university);
    const majorId = majorByName.get(item.major);
    if (!universityId || !majorId) {
      throw new Error(
        `Relasi tidak ditemukan: ${item.university} / ${item.major}`,
      );
    }
    return {
      universityId,
      majorId,
      capacity: item.capacity,
      estimatedTuition: item.estimatedTuition,
    };
  });

  await db.insert(universityMajors).values(relations);

  console.log(
    `Selesai: ${insertedMajors.length} jurusan, ${insertedUniversities.length} kampus, ${relations.length} relasi kampus-jurusan.`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
