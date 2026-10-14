import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { majors, universities, universityMajors } from "./schema";

type SeedMajor = {
  name: string;
  description: string;
  careerProspects: string;
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
  },
  {
    name: "Sistem Informasi",
    description:
      "Menggabungkan teknologi dan proses bisnis: merancang sistem informasi yang dipakai organisasi.",
    careerProspects:
      "Business analyst, konsultan sistem, product manager, UI/UX researcher, IT auditor.",
  },
  {
    name: "Teknik Elektro",
    description:
      "Mempelajari listrik, elektronika, kontrol, telekomunikasi, dan energi terbarukan.",
    careerProspects:
      "Electrical engineer, IoT engineer, energy analyst, automation specialist.",
  },
  {
    name: "Kedokteran",
    description:
      "Ilmu kesehatan untuk mendiagnosis, merawat, dan mencegah penyakit pada manusia.",
    careerProspects:
      "Dokter umum, dokter spesialis, peneliti medis, dokter komunitas.",
  },
  {
    name: "Keperawatan",
    description:
      "Merawat pasien secara holistik: fisik, mental, dan sosial, di berbagai layanan kesehatan.",
    careerProspects:
      "Perawat klinis, perawat komunitas, manajer layanan kesehatan, pendidik keperawatan.",
  },
  {
    name: "Psikologi",
    description:
      "Memahami perilaku dan proses mental manusia, termasuk asesmen dan pendampingan.",
    careerProspects:
      "Psikolog klinis, HR specialist, konselor, peneliti perilaku, UX researcher.",
  },
  {
    name: "Manajemen",
    description:
      "Mengelola organisasi: strategi, pemasaran, operasional, sumber daya manusia, dan keuangan.",
    careerProspects:
      "Business development, konsultan manajemen, entrepreneur, product manager.",
  },
  {
    name: "Akuntansi",
    description:
      "Menyusun, menganalisis, dan mengaudit laporan keuangan serta perpajakan.",
    careerProspects:
      "Akuntan publik, auditor, analis keuangan, konsultan pajak, controller.",
  },
  {
    name: "Ilmu Hukum",
    description:
      "Mempelajari aturan hukum, keadilan, dan penerapannya di masyarakat dan bisnis.",
    careerProspects:
      "Advokat, notaris, hakim/jaksa, legal counsel, analis kebijakan.",
  },
  {
    name: "Ilmu Komunikasi",
    description:
      "Strategi komunikasi, media, periklanan, jurnalistik, dan hubungan masyarakat.",
    careerProspects:
      "PR officer, content strategist, jurnalis, social media specialist, copywriter.",
  },
  {
    name: "Desain Komunikasi Visual",
    description:
      "Merancang pesan visual: desain grafis, ilustrasi, branding, dan media digital.",
    careerProspects:
      "Graphic designer, brand designer, illustrator, motion designer, art director.",
  },
  {
    name: "Sastra Inggris",
    description:
      "Mendalami bahasa, sastra, dan budaya Inggris serta penerjemahan.",
    careerProspects:
      "Penerjemah, editor, content writer, dosen, diplomat, spesialis komunikasi global.",
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
    console.log(
      `Data jurusan sudah terisi (${existing.count} jurusan). Pakai --force kalau mau isi ulang.`,
    );
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
