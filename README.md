# Terang.in

Platform analisis dan AI chatbot yang membantu siswa SMA memilih jurusan kuliah dengan sadar: asesmen minat, bakat, kepribadian, dan gaya belajar, input nilai rapor, analisis AI yang mencocokkan minat dengan kemampuan, lalu ngobrol dengan Tera, chatbot personal yang menjawab pakai data profil dan data kampus.

Spesifikasi produk lengkap ada di [`PRD.md`](./PRD.md). Desain landing merujuk ke [`UI_DESIGN_PNG/Landing Page.png`](./UI_DESIGN_PNG).

## Fitur

| Fase | Fitur | Status |
|------|-------|--------|
| 1 | Onboarding: data dasar (sekolah, kelas, minat awal) + tur interaktif 4 slide | Selesai |
| 2a | Asesmen minat & bakat: 24 soal, 4 kategori, timer 15 detik per soal, autosave, grid navigasi | Selesai |
| 2b | Input nilai rapor: tab semester dinamis, baris mapel dinamis, saran mapel dari Semester 1, autosave | Selesai |
| 3 | Analisis AI: profil kepribadian, kekuatan, dan rekomendasi jurusan dengan data kampus (daya tampung + estimasi UKT) | Selesai |
| 4 | Chat Tera: streaming AI personal berdasarkan hasil analisis dan katalog kampus | Selesai |
| 5 | Rencana aksi: pilihan jurusan final, roadmap, skor keyakinan | Belum |
| 6 | Hasil akhir: dokumen personal, unduh, dan bagikan | Belum |

Landing page publik dan autentikasi (signup, login, logout) juga sudah berjalan.

## Techstack

- **Next.js 16** (App Router, Turbopack, Cache Components) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **motion** (Framer Motion)
- **Auth.js v5** (next-auth beta): Credentials + JWT session, bcryptjs
- **PostgreSQL** + **Drizzle ORM** (postgres.js)
- **Vercel AI SDK v7** + **Groq** (`openai/gpt-oss-120b`): structured output untuk analisis, streaming untuk chat
- **zod**, **react-markdown**

## Prasyarat

- Node.js 20+ (dites di v22)
- PostgreSQL lokal (dites di Homebrew `postgresql@18`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Siapkan database:

```bash
createdb terangin
npm run db:push
npm run db:seed            # 24 soal asesmen
npm run db:seed-colleges   # 12 jurusan, 10 kampus, 34 relasi (daya tampung + estimasi UKT)
```

3. Buat `.env.local`:

```bash
DATABASE_URL=postgresql://<user>@localhost:5432/terangin
AUTH_SECRET=<hasil dari: openssl rand -base64 33>
GROQ_API_KEY=gsk_...        # dari console.groq.com, dipakai analisis + chat
```

4. Jalankan:

```bash
npm run dev
```

Buka http://localhost:3000.

## Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` / `build` / `start` / `lint` | Next.js standar |
| `npm run db:push` | Sync schema Drizzle ke database |
| `npm run db:seed` | Seed bank soal asesmen (idempotent, tambah `--force` untuk isi ulang) |
| `npm run db:seed-colleges` | Seed data jurusan dan kampus (idempotent) |
| `npm run db:studio` | Drizzle Studio |

## Alur Produk

```
Landing /  >  Signup/Login  >  Onboarding  >  Asesmen  >  Input Nilai  >  Hasil Analisis  >  Chat Tera
```

Setiap halaman dijaga (guard): user diarahkan ke langkah yang belum selesai kalau membuka halaman lanjutan. Status langkah di sidebar di-derivasi otomatis dari database.

## Dokumentasi

- [`PRD.md`](./PRD.md) - spesifikasi produk dan schema data
- [`architecture.md`](./architecture.md) - techstack, struktur file, fungsi kunci, integrasi AI
- [`ui.md`](./ui.md) - design tokens, spesifikasi komponen, peta UI
- [`continue.md`](./continue.md) - status pengembangan terkini, keputusan, dan catatan teknis

## Akun Test (development)

Semua akun test memakai password `password123`:

| Email | Status |
|-------|--------|
| `tera.nilai3.1791999472662@example.com` | Journey lengkap (onboarding, asesmen, nilai, analisis, chat) |
| `tera.sb.1792000221789@example.com` | Sampai asesmen (untuk test halaman terkunci) |

Reset data user (bank soal dan katalog kampus tetap aman):

```sql
TRUNCATE TABLE users CASCADE;
```
