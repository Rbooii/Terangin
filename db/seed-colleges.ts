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
  capacity: number | null;
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

const PTN_UNIVERSITIES: SeedUniversity[] = [
  { name: "Universitas Syiah Kuala", type: "PTN", location: "Banda Aceh" },
  { name: "Universitas Malikussaleh", type: "PTN", location: "Lhokseumawe" },
  { name: "Universitas Samudra", type: "PTN", location: "Langsa" },
  { name: "Universitas Teuku Umar", type: "PTN", location: "Meulaboh" },
  { name: "Universitas Maritim Raja Ali Haji", type: "PTN", location: "Tanjungpinang" },
  { name: "Universitas Sumatera Utara", type: "PTN", location: "Medan" },
  { name: "Universitas Negeri Medan", type: "PTN", location: "Medan" },
  { name: "Universitas Riau", type: "PTN", location: "Pekanbaru" },
  { name: "Universitas Jambi", type: "PTN", location: "Jambi" },
  { name: "Universitas Bengkulu", type: "PTN", location: "Bengkulu" },
  { name: "Universitas Sriwijaya", type: "PTN", location: "Palembang" },
  { name: "Universitas Bangka Belitung", type: "PTN", location: "Bangka" },
  { name: "Universitas Lampung", type: "PTN", location: "Bandar Lampung" },
  { name: "Institut Teknologi Sumatera", type: "PTN", location: "Lampung Selatan" },
  { name: "Universitas Sultan Ageng Tirtayasa", type: "PTN", location: "Serang" },
  { name: "Universitas Terbuka", type: "PTN", location: "Tangerang Selatan" },
  { name: "Universitas Indonesia", type: "PTN", location: "Depok" },
  { name: "Universitas Negeri Jakarta", type: "PTN", location: "Jakarta" },
  { name: "UPN Veteran Jakarta", type: "PTN", location: "Jakarta" },
  { name: "Universitas Pertahanan Indonesia", type: "PTN", location: "Bogor" },
  { name: "Universitas Islam Internasional Indonesia", type: "PTN", location: "Depok" },
  { name: "Institut Teknologi Bandung", type: "PTN", location: "Bandung" },
  { name: "Universitas Padjadjaran", type: "PTN", location: "Bandung" },
  { name: "Universitas Pendidikan Indonesia", type: "PTN", location: "Bandung" },
  { name: "Institut Pertanian Bogor", type: "PTN", location: "Bogor" },
  { name: "Universitas Siliwangi", type: "PTN", location: "Tasikmalaya" },
  { name: "Universitas Singaperbangsa Karawang", type: "PTN", location: "Karawang" },
  { name: "ISBI Bandung", type: "PTN", location: "Bandung" },
  { name: "Universitas Jenderal Achmad Yani", type: "PTN", location: "Cimahi" },
  { name: "Universitas Andalas", type: "PTN", location: "Padang" },
  { name: "Universitas Negeri Padang", type: "PTN", location: "Padang" },
  { name: "ISI Padang Panjang", type: "PTN", location: "Padang Panjang" },
  { name: "Universitas Diponegoro", type: "PTN", location: "Semarang" },
  { name: "Universitas Negeri Semarang", type: "PTN", location: "Semarang" },
  { name: "Universitas Jenderal Soedirman", type: "PTN", location: "Purwokerto" },
  { name: "Universitas Sebelas Maret", type: "PTN", location: "Surakarta" },
  { name: "Universitas Tidar", type: "PTN", location: "Magelang" },
  { name: "ISI Surakarta", type: "PTN", location: "Surakarta" },
  { name: "Universitas Gadjah Mada", type: "PTN", location: "Yogyakarta" },
  { name: "Universitas Negeri Yogyakarta", type: "PTN", location: "Yogyakarta" },
  { name: "UPN Veteran Yogyakarta", type: "PTN", location: "Yogyakarta" },
  { name: "ISI Yogyakarta", type: "PTN", location: "Yogyakarta" },
  { name: "Universitas Airlangga", type: "PTN", location: "Surabaya" },
  { name: "Institut Teknologi Sepuluh Nopember", type: "PTN", location: "Surabaya" },
  { name: "Universitas Brawijaya", type: "PTN", location: "Malang" },
  { name: "Universitas Negeri Malang", type: "PTN", location: "Malang" },
  { name: "Universitas Jember", type: "PTN", location: "Jember" },
  { name: "Universitas Negeri Surabaya", type: "PTN", location: "Surabaya" },
  { name: "Universitas Trunojoyo Madura", type: "PTN", location: "Bangkalan" },
  { name: "UPN Veteran Jawa Timur", type: "PTN", location: "Surabaya" },
  { name: "Universitas Udayana", type: "PTN", location: "Denpasar" },
  { name: "Universitas Pendidikan Ganesha", type: "PTN", location: "Singaraja" },
  { name: "ISI Denpasar", type: "PTN", location: "Denpasar" },
  { name: "Universitas Mataram", type: "PTN", location: "Mataram" },
  { name: "Universitas Nusa Cendana", type: "PTN", location: "Kupang" },
  { name: "Universitas Timor", type: "PTN", location: "Kefamenanu" },
  { name: "Universitas Tanjungpura", type: "PTN", location: "Pontianak" },
  { name: "Universitas Palangka Raya", type: "PTN", location: "Palangka Raya" },
  { name: "Universitas Lambung Mangkurat", type: "PTN", location: "Banjarmasin" },
  { name: "Universitas Mulawarman", type: "PTN", location: "Samarinda" },
  { name: "Institut Teknologi Kalimantan", type: "PTN", location: "Balikpapan" },
  { name: "Universitas Borneo Tarakan", type: "PTN", location: "Tarakan" },
  { name: "Universitas Sam Ratulangi", type: "PTN", location: "Manado" },
  { name: "Universitas Negeri Manado", type: "PTN", location: "Tondano" },
  { name: "Universitas Negeri Gorontalo", type: "PTN", location: "Gorontalo" },
  { name: "Universitas Tadulako", type: "PTN", location: "Palu" },
  { name: "Universitas Sulawesi Barat", type: "PTN", location: "Majene" },
  { name: "Universitas Hasanuddin", type: "PTN", location: "Makassar" },
  { name: "Universitas Negeri Makassar", type: "PTN", location: "Makassar" },
  { name: "Institut Teknologi Bacharuddin Jusuf Habibie", type: "PTN", location: "Parepare" },
  { name: "Universitas Halu Oleo", type: "PTN", location: "Kendari" },
  { name: "Universitas Sembilanbelas November Kolaka", type: "PTN", location: "Kolaka" },
  { name: "Universitas Pattimura", type: "PTN", location: "Ambon" },
  { name: "Universitas Khairun", type: "PTN", location: "Ternate" },
  { name: "Universitas Cenderawasih", type: "PTN", location: "Jayapura" },
  { name: "Universitas Papua", type: "PTN", location: "Manokwari" },
];

const UIN_UNIVERSITIES: SeedUniversity[] = [
  { name: "UIN Ar-Raniry", type: "PTN", location: "Banda Aceh" },
  { name: "UIN Sumatera Utara", type: "PTN", location: "Medan" },
  { name: "UIN Imam Bonjol", type: "PTN", location: "Padang" },
  { name: "UIN Sultan Syarif Kasim", type: "PTN", location: "Pekanbaru" },
  { name: "UIN Sulthan Thaha Saifuddin", type: "PTN", location: "Jambi" },
  { name: "UIN Fatmawati Sukarno", type: "PTN", location: "Bengkulu" },
  { name: "UIN Raden Fatah", type: "PTN", location: "Palembang" },
  { name: "UIN Raden Intan", type: "PTN", location: "Bandar Lampung" },
  { name: "UIN Sultan Maulana Hasanuddin", type: "PTN", location: "Serang" },
  { name: "UIN Syarif Hidayatullah", type: "PTN", location: "Tangerang Selatan" },
  { name: "UIN Sunan Gunung Djati", type: "PTN", location: "Bandung" },
  { name: "UIN Walisongo", type: "PTN", location: "Semarang" },
  { name: "UIN Raden Mas Said", type: "PTN", location: "Surakarta" },
  { name: "UIN Salatiga", type: "PTN", location: "Salatiga" },
  { name: "UIN Prof. K.H. Saifuddin Zuhri", type: "PTN", location: "Purwokerto" },
  { name: "UIN Sunan Kalijaga", type: "PTN", location: "Yogyakarta" },
  { name: "UIN Sunan Ampel", type: "PTN", location: "Surabaya" },
  { name: "UIN Maulana Malik Ibrahim", type: "PTN", location: "Malang" },
  { name: "UIN Sayyid Ali Rahmatullah", type: "PTN", location: "Tulungagung" },
  { name: "UIN Sunan Kudus", type: "PTN", location: "Kudus" },
  { name: "UIN Syekh Wasil", type: "PTN", location: "Kediri" },
  { name: "UIN Madura", type: "PTN", location: "Pamekasan" },
  { name: "UIN Mataram", type: "PTN", location: "Mataram" },
  { name: "UIN Antasari", type: "PTN", location: "Banjarmasin" },
];

const PTS_UNIVERSITIES: SeedUniversity[] = [
  { name: "Bina Nusantara", type: "PTS", location: "Jakarta" },
  { name: "Telkom University", type: "PTS", location: "Bandung" },
  { name: "Universitas Pelita Harapan", type: "PTS", location: "Tangerang" },
  { name: "Universitas Trisakti", type: "PTS", location: "Jakarta" },
  { name: "Universitas Katolik Indonesia Atma Jaya", type: "PTS", location: "Jakarta" },
  { name: "Universitas Katolik Parahyangan", type: "PTS", location: "Bandung" },
  { name: "Universitas Islam Indonesia", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Muhammadiyah Yogyakarta", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Muhammadiyah Malang", type: "PTS", location: "Malang" },
  { name: "Universitas Muhammadiyah Surakarta", type: "PTS", location: "Surakarta" },
  { name: "Universitas Ahmad Dahlan", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Muhammadiyah Sumatera Utara", type: "PTS", location: "Medan" },
  { name: "Universitas Medan Area", type: "PTS", location: "Medan" },
  { name: "Universitas Prima Indonesia", type: "PTS", location: "Medan" },
  { name: "Universitas HKBP Nommensen", type: "PTS", location: "Medan" },
  { name: "Universitas Gunadarma", type: "PTS", location: "Depok" },
  { name: "Universitas Mercu Buana", type: "PTS", location: "Jakarta" },
  { name: "Universitas Bunda Mulia", type: "PTS", location: "Jakarta" },
  { name: "Universitas Multimedia Nusantara", type: "PTS", location: "Tangerang" },
  { name: "Universitas Ciputra", type: "PTS", location: "Surabaya" },
  { name: "President University", type: "PTS", location: "Cikarang" },
  { name: "Universitas Prasetiya Mulya", type: "PTS", location: "Tangerang" },
  { name: "Universitas Bakrie", type: "PTS", location: "Jakarta" },
  { name: "Universitas Paramadina", type: "PTS", location: "Jakarta" },
  { name: "Universitas Al Azhar Indonesia", type: "PTS", location: "Jakarta" },
  { name: "Universitas Nasional", type: "PTS", location: "Jakarta" },
  { name: "Universitas Pancasila", type: "PTS", location: "Jakarta" },
  { name: "Universitas Kristen Krida Wacana", type: "PTS", location: "Jakarta" },
  { name: "Universitas Tarumanagara", type: "PTS", location: "Jakarta" },
  { name: "Universitas Kristen Indonesia", type: "PTS", location: "Jakarta" },
  { name: "Universitas Esa Unggul", type: "PTS", location: "Jakarta" },
  { name: "Universitas Katolik Widya Mandala Surabaya", type: "PTS", location: "Surabaya" },
  { name: "Universitas Kristen Petra", type: "PTS", location: "Surabaya" },
  { name: "Universitas Surabaya", type: "PTS", location: "Surabaya" },
  { name: "Universitas Kristen Maranatha", type: "PTS", location: "Bandung" },
  { name: "Universitas Widyatama", type: "PTS", location: "Bandung" },
  { name: "Universitas Pasundan", type: "PTS", location: "Bandung" },
  { name: "Institut Teknologi Nasional Bandung", type: "PTS", location: "Bandung" },
  { name: "Universitas Komputer Indonesia", type: "PTS", location: "Bandung" },
  { name: "Universitas Islam Bandung", type: "PTS", location: "Bandung" },
  { name: "Universitas Islam Nusantara", type: "PTS", location: "Bandung" },
  { name: "Universitas Kristen Satya Wacana", type: "PTS", location: "Salatiga" },
  { name: "Universitas Dian Nuswantoro", type: "PTS", location: "Semarang" },
  { name: "Universitas Islam Sultan Agung", type: "PTS", location: "Semarang" },
  { name: "Universitas Katolik Soegijapranata", type: "PTS", location: "Semarang" },
  { name: "Universitas Kristen Duta Wacana", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Atma Jaya Yogyakarta", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Sanata Dharma", type: "PTS", location: "Yogyakarta" },
  { name: "Universitas Klabat", type: "PTS", location: "Manado" },
  { name: "Universitas Islam Malang", type: "PTS", location: "Malang" },
  { name: "Universitas PGRI Kanjuruhan Malang", type: "PTS", location: "Malang" },
  { name: "Universitas Merdeka Malang", type: "PTS", location: "Malang" },
  { name: "Universitas Bina Darma", type: "PTS", location: "Palembang" },
  { name: "Universitas Tridinanti", type: "PTS", location: "Palembang" },
  { name: "Universitas Islam Riau", type: "PTS", location: "Pekanbaru" },
  { name: "Universitas Lancang Kuning", type: "PTS", location: "Pekanbaru" },
  { name: "Universitas Bung Hatta", type: "PTS", location: "Padang" },
  { name: "Universitas Muhammadiyah Sumatera Barat", type: "PTS", location: "Bukittinggi" },
  { name: "Universitas Batanghari", type: "PTS", location: "Jambi" },
  { name: "Universitas Bandar Lampung", type: "PTS", location: "Bandar Lampung" },
  { name: "Universitas Malahayati", type: "PTS", location: "Bandar Lampung" },
  { name: "Universitas Serang Raya", type: "PTS", location: "Serang" },
  { name: "Universitas Warmadewa", type: "PTS", location: "Denpasar" },
  { name: "Universitas Pendidikan Nasional", type: "PTS", location: "Denpasar" },
  { name: "Universitas Yapis Papua", type: "PTS", location: "Jayapura" },
  { name: "Universitas Muhammadiyah Mataram", type: "PTS", location: "Mataram" },
  { name: "Universitas Muslim Indonesia", type: "PTS", location: "Makassar" },
  { name: "Universitas Bosowa", type: "PTS", location: "Makassar" },
  { name: "Universitas Atma Jaya Makassar", type: "PTS", location: "Makassar" },
  { name: "Universitas Kristen Indonesia Paulus", type: "PTS", location: "Makassar" },
];

const PTLN_UNIVERSITIES: SeedUniversity[] = [
  { name: "National University of Singapore", type: "PTLN", location: "Singapura" },
  { name: "Nanyang Technological University", type: "PTLN", location: "Singapura" },
  { name: "Singapore Management University", type: "PTLN", location: "Singapura" },
  { name: "Universiti Malaya", type: "PTLN", location: "Kuala Lumpur, Malaysia" },
  { name: "Universiti Teknologi Malaysia", type: "PTLN", location: "Johor Bahru, Malaysia" },
  { name: "Universiti Kebangsaan Malaysia", type: "PTLN", location: "Bangi, Malaysia" },
  { name: "Universiti Sains Malaysia", type: "PTLN", location: "Penang, Malaysia" },
  { name: "Universiti Putra Malaysia", type: "PTLN", location: "Serdang, Malaysia" },
  { name: "University of Tokyo", type: "PTLN", location: "Tokyo, Jepang" },
  { name: "Kyoto University", type: "PTLN", location: "Kyoto, Jepang" },
  { name: "Waseda University", type: "PTLN", location: "Tokyo, Jepang" },
  { name: "University of Melbourne", type: "PTLN", location: "Melbourne, Australia" },
  { name: "UNSW Sydney", type: "PTLN", location: "Sydney, Australia" },
  { name: "University of Sydney", type: "PTLN", location: "Sydney, Australia" },
  { name: "Australian National University", type: "PTLN", location: "Canberra, Australia" },
  { name: "Monash University", type: "PTLN", location: "Melbourne, Australia" },
  { name: "University of Oxford", type: "PTLN", location: "Oxford, Inggris" },
  { name: "University of Cambridge", type: "PTLN", location: "Cambridge, Inggris" },
  { name: "Imperial College London", type: "PTLN", location: "London, Inggris" },
  { name: "University College London", type: "PTLN", location: "London, Inggris" },
  { name: "University of Edinburgh", type: "PTLN", location: "Edinburgh, Inggris" },
  { name: "Massachusetts Institute of Technology", type: "PTLN", location: "Cambridge, Amerika Serikat" },
  { name: "Stanford University", type: "PTLN", location: "Stanford, Amerika Serikat" },
  { name: "Harvard University", type: "PTLN", location: "Cambridge, Amerika Serikat" },
  { name: "University of California, Berkeley", type: "PTLN", location: "Berkeley, Amerika Serikat" },
  { name: "Delft University of Technology", type: "PTLN", location: "Delft, Belanda" },
  { name: "Technical University of Munich", type: "PTLN", location: "Munich, Jerman" },
  { name: "Seoul National University", type: "PTLN", location: "Seoul, Korea Selatan" },
  { name: "KAIST", type: "PTLN", location: "Daejeon, Korea Selatan" },
  { name: "University of Hong Kong", type: "PTLN", location: "Hong Kong" },
];

const UNIVERSITIES: SeedUniversity[] = [
  ...PTN_UNIVERSITIES,
  ...UIN_UNIVERSITIES,
  ...PTS_UNIVERSITIES,
  ...PTLN_UNIVERSITIES,
];

const CAMPUS_MAJORS: SeedCampusMajor[] = [
  { university: "Universitas Indonesia", major: "Teknik Informatika", capacity: 70, estimatedTuition: "8500000.00" },
  { university: "Institut Teknologi Bandung", major: "Teknik Informatika", capacity: 85, estimatedTuition: "10000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Teknik Informatika", capacity: 90, estimatedTuition: "8000000.00" },
  { university: "Universitas Gadjah Mada", major: "Teknik Informatika", capacity: 80, estimatedTuition: "9000000.00" },
  { university: "Universitas Brawijaya", major: "Teknik Informatika", capacity: 100, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Teknik Informatika", capacity: 75, estimatedTuition: "8000000.00" },
  { university: "Universitas Hasanuddin", major: "Teknik Informatika", capacity: 90, estimatedTuition: "7000000.00" },
  { university: "Universitas Sumatera Utara", major: "Teknik Informatika", capacity: 80, estimatedTuition: "6500000.00" },
  { university: "Telkom University", major: "Teknik Informatika", capacity: 300, estimatedTuition: "18000000.00" },
  { university: "Bina Nusantara", major: "Teknik Informatika", capacity: 250, estimatedTuition: "25000000.00" },
  { university: "National University of Singapore", major: "Teknik Informatika", capacity: null, estimatedTuition: "130000000.00" },
  { university: "University of Melbourne", major: "Teknik Informatika", capacity: null, estimatedTuition: "140000000.00" },

  { university: "Universitas Indonesia", major: "Sistem Informasi", capacity: 55, estimatedTuition: "8500000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Sistem Informasi", capacity: 60, estimatedTuition: "8000000.00" },
  { university: "Universitas Gadjah Mada", major: "Sistem Informasi", capacity: 60, estimatedTuition: "9000000.00" },
  { university: "Universitas Airlangga", major: "Sistem Informasi", capacity: 70, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Sistem Informasi", capacity: 70, estimatedTuition: "8000000.00" },
  { university: "Universitas Padjadjaran", major: "Sistem Informasi", capacity: 60, estimatedTuition: "7500000.00" },
  { university: "Telkom University", major: "Sistem Informasi", capacity: 250, estimatedTuition: "17000000.00" },
  { university: "Bina Nusantara", major: "Sistem Informasi", capacity: 220, estimatedTuition: "24000000.00" },
  { university: "Universitas Multimedia Nusantara", major: "Sistem Informasi", capacity: 150, estimatedTuition: "19000000.00" },
  { university: "Nanyang Technological University", major: "Sistem Informasi", capacity: null, estimatedTuition: "120000000.00" },
  { university: "Universiti Malaya", major: "Sistem Informasi", capacity: null, estimatedTuition: "25000000.00" },

  { university: "Institut Teknologi Bandung", major: "Teknik Elektro", capacity: 75, estimatedTuition: "10000000.00" },
  { university: "Universitas Indonesia", major: "Teknik Elektro", capacity: 60, estimatedTuition: "8500000.00" },
  { university: "Universitas Gadjah Mada", major: "Teknik Elektro", capacity: 65, estimatedTuition: "9000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Teknik Elektro", capacity: 75, estimatedTuition: "8000000.00" },
  { university: "Universitas Diponegoro", major: "Teknik Elektro", capacity: 70, estimatedTuition: "8000000.00" },
  { university: "Universitas Andalas", major: "Teknik Elektro", capacity: 60, estimatedTuition: "6500000.00" },
  { university: "Universitas Hasanuddin", major: "Teknik Elektro", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Teknik Elektro", capacity: 75, estimatedTuition: "7500000.00" },
  { university: "Telkom University", major: "Teknik Elektro", capacity: 200, estimatedTuition: "18000000.00" },
  { university: "Bina Nusantara", major: "Teknik Elektro", capacity: 120, estimatedTuition: "24000000.00" },
  { university: "Nanyang Technological University", major: "Teknik Elektro", capacity: null, estimatedTuition: "120000000.00" },

  { university: "Universitas Indonesia", major: "Kedokteran", capacity: 60, estimatedTuition: "12000000.00" },
  { university: "Universitas Gadjah Mada", major: "Kedokteran", capacity: 60, estimatedTuition: "12000000.00" },
  { university: "Universitas Airlangga", major: "Kedokteran", capacity: 75, estimatedTuition: "15000000.00" },
  { university: "Universitas Diponegoro", major: "Kedokteran", capacity: 70, estimatedTuition: "12000000.00" },
  { university: "Universitas Padjadjaran", major: "Kedokteran", capacity: 70, estimatedTuition: "12000000.00" },
  { university: "Universitas Brawijaya", major: "Kedokteran", capacity: 70, estimatedTuition: "13000000.00" },
  { university: "Universitas Hasanuddin", major: "Kedokteran", capacity: 75, estimatedTuition: "12000000.00" },
  { university: "Universitas Andalas", major: "Kedokteran", capacity: 65, estimatedTuition: "11000000.00" },
  { university: "Universitas Sriwijaya", major: "Kedokteran", capacity: 60, estimatedTuition: "11000000.00" },
  { university: "Universitas Pelita Harapan", major: "Kedokteran", capacity: 90, estimatedTuition: "30000000.00" },
  { university: "National University of Singapore", major: "Kedokteran", capacity: null, estimatedTuition: "180000000.00" },

  { university: "Universitas Indonesia", major: "Keperawatan", capacity: 80, estimatedTuition: "7500000.00" },
  { university: "Universitas Airlangga", major: "Keperawatan", capacity: 90, estimatedTuition: "7000000.00" },
  { university: "Universitas Padjadjaran", major: "Keperawatan", capacity: 75, estimatedTuition: "7000000.00" },
  { university: "Universitas Diponegoro", major: "Keperawatan", capacity: 85, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Keperawatan", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Universitas Hasanuddin", major: "Keperawatan", capacity: 90, estimatedTuition: "6500000.00" },
  { university: "Universitas Sumatera Utara", major: "Keperawatan", capacity: 80, estimatedTuition: "6000000.00" },
  { university: "Universitas Muhammadiyah Yogyakarta", major: "Keperawatan", capacity: 120, estimatedTuition: "9000000.00" },
  { university: "Universitas Katolik Widya Mandala Surabaya", major: "Keperawatan", capacity: 90, estimatedTuition: "12000000.00" },
  { university: "Universitas Pelita Harapan", major: "Keperawatan", capacity: 80, estimatedTuition: "22000000.00" },

  { university: "Universitas Indonesia", major: "Psikologi", capacity: 85, estimatedTuition: "7000000.00" },
  { university: "Universitas Gadjah Mada", major: "Psikologi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Padjadjaran", major: "Psikologi", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Airlangga", major: "Psikologi", capacity: 80, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Psikologi", capacity: 75, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Psikologi", capacity: 80, estimatedTuition: "7500000.00" },
  { university: "Universitas Hasanuddin", major: "Psikologi", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Sebelas Maret", major: "Psikologi", capacity: 65, estimatedTuition: "6500000.00" },
  { university: "Universitas Islam Indonesia", major: "Psikologi", capacity: 130, estimatedTuition: "9000000.00" },
  { university: "Universitas Muhammadiyah Yogyakarta", major: "Psikologi", capacity: 140, estimatedTuition: "9500000.00" },
  { university: "Universitas Tarumanagara", major: "Psikologi", capacity: 150, estimatedTuition: "13000000.00" },

  { university: "Universitas Indonesia", major: "Manajemen", capacity: 100, estimatedTuition: "7500000.00" },
  { university: "Universitas Gadjah Mada", major: "Manajemen", capacity: 95, estimatedTuition: "7500000.00" },
  { university: "Universitas Padjadjaran", major: "Manajemen", capacity: 90, estimatedTuition: "7000000.00" },
  { university: "Universitas Airlangga", major: "Manajemen", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Manajemen", capacity: 95, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Manajemen", capacity: 100, estimatedTuition: "7500000.00" },
  { university: "Universitas Hasanuddin", major: "Manajemen", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Universitas Sebelas Maret", major: "Manajemen", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Telkom University", major: "Manajemen", capacity: 250, estimatedTuition: "16000000.00" },
  { university: "Bina Nusantara", major: "Manajemen", capacity: 300, estimatedTuition: "24000000.00" },
  { university: "Universitas Pelita Harapan", major: "Manajemen", capacity: 200, estimatedTuition: "22000000.00" },
  { university: "Singapore Management University", major: "Manajemen", capacity: null, estimatedTuition: "90000000.00" },

  { university: "Universitas Indonesia", major: "Akuntansi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Gadjah Mada", major: "Akuntansi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Padjadjaran", major: "Akuntansi", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Universitas Airlangga", major: "Akuntansi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Diponegoro", major: "Akuntansi", capacity: 85, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Akuntansi", capacity: 90, estimatedTuition: "7500000.00" },
  { university: "Universitas Hasanuddin", major: "Akuntansi", capacity: 75, estimatedTuition: "7000000.00" },
  { university: "Universitas Sebelas Maret", major: "Akuntansi", capacity: 75, estimatedTuition: "7000000.00" },
  { university: "Universitas Islam Indonesia", major: "Akuntansi", capacity: 120, estimatedTuition: "8500000.00" },
  { university: "Telkom University", major: "Akuntansi", capacity: 180, estimatedTuition: "16000000.00" },
  { university: "Bina Nusantara", major: "Akuntansi", capacity: 250, estimatedTuition: "24000000.00" },

  { university: "Universitas Indonesia", major: "Ilmu Hukum", capacity: 100, estimatedTuition: "6500000.00" },
  { university: "Universitas Gadjah Mada", major: "Ilmu Hukum", capacity: 110, estimatedTuition: "6500000.00" },
  { university: "Universitas Padjadjaran", major: "Ilmu Hukum", capacity: 100, estimatedTuition: "7000000.00" },
  { university: "Universitas Diponegoro", major: "Ilmu Hukum", capacity: 110, estimatedTuition: "6500000.00" },
  { university: "Universitas Airlangga", major: "Ilmu Hukum", capacity: 90, estimatedTuition: "7000000.00" },
  { university: "Universitas Brawijaya", major: "Ilmu Hukum", capacity: 100, estimatedTuition: "7000000.00" },
  { university: "Universitas Hasanuddin", major: "Ilmu Hukum", capacity: 90, estimatedTuition: "6500000.00" },
  { university: "Universitas Sebelas Maret", major: "Ilmu Hukum", capacity: 90, estimatedTuition: "6500000.00" },
  { university: "Universitas Islam Indonesia", major: "Ilmu Hukum", capacity: 150, estimatedTuition: "8500000.00" },
  { university: "Universitas Trisakti", major: "Ilmu Hukum", capacity: 250, estimatedTuition: "15000000.00" },
  { university: "Universiti Malaya", major: "Ilmu Hukum", capacity: null, estimatedTuition: "25000000.00" },

  { university: "Universitas Indonesia", major: "Ilmu Komunikasi", capacity: 60, estimatedTuition: "7000000.00" },
  { university: "Universitas Gadjah Mada", major: "Ilmu Komunikasi", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Padjadjaran", major: "Ilmu Komunikasi", capacity: 90, estimatedTuition: "6500000.00" },
  { university: "Universitas Airlangga", major: "Ilmu Komunikasi", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "Universitas Diponegoro", major: "Ilmu Komunikasi", capacity: 75, estimatedTuition: "6500000.00" },
  { university: "Universitas Brawijaya", major: "Ilmu Komunikasi", capacity: 80, estimatedTuition: "7000000.00" },
  { university: "Universitas Sebelas Maret", major: "Ilmu Komunikasi", capacity: 60, estimatedTuition: "6500000.00" },
  { university: "Telkom University", major: "Ilmu Komunikasi", capacity: 150, estimatedTuition: "15000000.00" },
  { university: "Universitas Multimedia Nusantara", major: "Ilmu Komunikasi", capacity: 180, estimatedTuition: "18000000.00" },
  { university: "Bina Nusantara", major: "Ilmu Komunikasi", capacity: 120, estimatedTuition: "23000000.00" },
  { university: "Universitas Pelita Harapan", major: "Ilmu Komunikasi", capacity: 120, estimatedTuition: "20000000.00" },

  { university: "Institut Teknologi Bandung", major: "Desain Komunikasi Visual", capacity: 60, estimatedTuition: "9500000.00" },
  { university: "ISI Yogyakarta", major: "Desain Komunikasi Visual", capacity: 70, estimatedTuition: "7000000.00" },
  { university: "ISI Denpasar", major: "Desain Komunikasi Visual", capacity: 60, estimatedTuition: "6000000.00" },
  { university: "Institut Teknologi Sepuluh Nopember", major: "Desain Komunikasi Visual", capacity: 50, estimatedTuition: "8000000.00" },
  { university: "Telkom University", major: "Desain Komunikasi Visual", capacity: 200, estimatedTuition: "16000000.00" },
  { university: "Bina Nusantara", major: "Desain Komunikasi Visual", capacity: 150, estimatedTuition: "22000000.00" },
  { university: "Universitas Multimedia Nusantara", major: "Desain Komunikasi Visual", capacity: 160, estimatedTuition: "19000000.00" },
  { university: "Universitas Kristen Petra", major: "Desain Komunikasi Visual", capacity: 160, estimatedTuition: "17000000.00" },
  { university: "Institut Teknologi Nasional Bandung", major: "Desain Komunikasi Visual", capacity: 120, estimatedTuition: "14000000.00" },
  { university: "Universitas Dian Nuswantoro", major: "Desain Komunikasi Visual", capacity: 100, estimatedTuition: "12000000.00" },

  { university: "Universitas Indonesia", major: "Sastra Inggris", capacity: 55, estimatedTuition: "6500000.00" },
  { university: "Universitas Gadjah Mada", major: "Sastra Inggris", capacity: 70, estimatedTuition: "6500000.00" },
  { university: "Universitas Padjadjaran", major: "Sastra Inggris", capacity: 70, estimatedTuition: "6500000.00" },
  { university: "Universitas Airlangga", major: "Sastra Inggris", capacity: 60, estimatedTuition: "6500000.00" },
  { university: "Universitas Diponegoro", major: "Sastra Inggris", capacity: 65, estimatedTuition: "6500000.00" },
  { university: "Universitas Brawijaya", major: "Sastra Inggris", capacity: 70, estimatedTuition: "6500000.00" },
  { university: "Universitas Negeri Yogyakarta", major: "Sastra Inggris", capacity: 60, estimatedTuition: "6000000.00" },
  { university: "Universitas Sebelas Maret", major: "Sastra Inggris", capacity: 60, estimatedTuition: "6000000.00" },
  { university: "Universitas Sanata Dharma", major: "Sastra Inggris", capacity: 80, estimatedTuition: "8000000.00" },
  { university: "Universitas Sumatera Utara", major: "Sastra Inggris", capacity: 70, estimatedTuition: "6000000.00" },
];

function buildRelations(
  majorRows: Array<{ id: string; name: string }>,
  universityRows: Array<{ id: string; name: string }>,
) {
  const majorByName = new Map(majorRows.map((row) => [row.name, row.id]));
  const universityByName = new Map(
    universityRows.map((row) => [row.name, row.id]),
  );
  return CAMPUS_MAJORS.map((item) => {
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
}

async function main() {
  const force = process.argv.includes("--force");
  const client = postgres(process.env.DATABASE_URL!, {
    connection: { TimeZone: "UTC" },
  });
  const db = drizzle(client);

  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(majors);

  if (existing.count > 0 && !force) {
    console.log(
      `Data jurusan sudah terisi (${existing.count} jurusan). Sinkronisasi data referensi non-destruktif...`,
    );

    let updatedProfiles = 0;
    for (const major of MAJORS) {
      const result = await db
        .update(majors)
        .set({ profile: major.profile })
        .where(eq(majors.name, major.name))
        .returning({ id: majors.id });
      updatedProfiles += result.length;
    }

    const existingUniversities = await db
      .select({ name: universities.name })
      .from(universities);
    const knownNames = new Set(existingUniversities.map((row) => row.name));
    const missingUniversities = UNIVERSITIES.filter(
      (university) => !knownNames.has(university.name),
    );
    if (missingUniversities.length > 0) {
      await db.insert(universities).values(missingUniversities);
    }

    await db.delete(universityMajors);

    const allMajors = await db
      .select({ id: majors.id, name: majors.name })
      .from(majors);
    const allUniversities = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities);

    const relations = buildRelations(allMajors, allUniversities);
    await db
      .insert(universityMajors)
      .values(relations)
      .onConflictDoNothing();

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(universities);

    console.log(
      `Selesai: ${updatedProfiles} profil jurusan diperbarui, ${missingUniversities.length} kampus baru, ${relations.length} relasi kampus-jurusan, total ${total.count} kampus.`,
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

  const relations = buildRelations(insertedMajors, insertedUniversities);
  await db.insert(universityMajors).values(relations).onConflictDoNothing();

  console.log(
    `Selesai: ${insertedMajors.length} jurusan, ${insertedUniversities.length} kampus, ${relations.length} relasi kampus-jurusan.`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
