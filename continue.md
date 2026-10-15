# continue.md — Handoff Sesi Terang.in

> **Untuk agent berikutnya:** baca dokumen ini dulu untuk memahami state terkini, riwayat keputusan, dan gotcha yang sudah ditemukan. Lanjut ke `architecture.md` untuk struktur teknis (file, fungsi, schema, AI pipeline) dan `ui.md` untuk design system. `PRD.md` adalah sumber kebenaran produk. Seluruh kode sudah ada di repo ini dan build-nya bersih — jangan membangun ulang dari nol, cukup lanjutkan dari state ini.

---

## 1. Apa ini

**Terang.in** adalah platform analisis + AI chatbot untuk membantu siswa SMA menentukan jurusan kuliah dengan sadar. Fitur inti per PRD: asesmen minat/bakat/kepribadian/gaya belajar, input nilai rapor, analisis rekomendasi jurusan dengan **skoring deterministik berbobot** (Minat 30 / Bakat 25 / Nilai 20 / Kepribadian 15 / Gaya belajar 10) yang dinarasikan AI, chatbot personal "Tera" yang menjawab dengan data kampus nyata dari database, dan (belum diimplementasi) rencana aksi final.

Aplikasi terdiri dari:
- **Landing page publik** (`/`) yang direplikasi 1:1 dari desain `UI_DESIGN_PNG/Landing Page.png`
- **Alur produk 5 langkah** untuk user login: Onboarding → Asesmen → Input Nilai → Hasil Analisis → Chat dengan Tera

---

## 2. Status terkini (per akhir sesi ini)

| # | Fitur | Status | Verifikasi |
|---|-------|--------|------------|
| — | Landing page (9 section) | ✅ Selesai | Screenshot desktop/mobile vs PNG desain |
| — | Auth (signup/login/logout, session) | ✅ Selesai | E2E penuh |
| — | Guard halaman publik: sudah login → `/dashboard` | ✅ Selesai | E2E 9/9 (guest, signup, login, logout) |
| 1 | Onboarding (data dasar + tur 4 slide) | ✅ Selesai | E2E penuh |
| 2a | Asesmen Minat & Bakat (24 soal + tag dimensi skoring) | ✅ Selesai | E2E penuh + cek DB |
| 2b | Input Nilai (dinamis per semester + wajib 7 mapel/semester) | ✅ Selesai | E2E penuh + cek DB |
| 3 | Hasil Analisis (skoring deterministik + narasi AI Groq) | ✅ Selesai | Unit check rumus 7/7 + E2E 10/10 + reproducible 2 run |
| 4 | Chat Tera (streaming AI + pembatasan scope + protokol curhat) | ✅ Selesai | E2E 12/12 + sanitasi teks + cek DB |
| 5 | Action Plan / Rencana Aksi | ❌ **Belum** | Tabel `action_plans` sudah ada |
| 6 | Hasil Akhir (export/share) | ❌ **Belum** | — |

**Kualitas saat ini:** `npm run lint` bersih, `npm run build` bersih, audit AI-slop bersih (app/components/lib/db). Semua fitur diverifikasi dengan unit check + E2E Playwright + pemeriksaan DB. Hasil verifikasi terakhir: unit check rumus skoring 7/7 PASS, E2E analisis 10/10 PASS (reproducible: dua kali run identik 87/84/83/82/81).

**Kondisi database (mesin Windows saat ini):** schema ter-push dan seed sudah dimigrasi ke format skoring: 24 soal (24/24 punya `dimension`), 12 jurusan (12/12 punya `profile`), 10 kampus, 34 relasi. Tabel `users` hanya berisi akun milik user (`michaelkevin3112@gmail.com`, `bloxfruit737@gmail.com`) — akun test E2E selalu dihapus setelah sesi; lihat §6 untuk resep membuat user uji. `psql` tidak tersedia di PATH (pakai skrip node).

**State git:** commit terakhir `c16fc03` ("feat: redirect login, validasi nilai minimum, dan pembatasan scope chat") mencakup guard redirect halaman publik, validasi 7 mapel, dan pembatasan scope chat. Perubahan **analisis deterministik (§3.13) masih uncommitted** di working tree saat dokumen ini ditulis (detail di §3.14).

---

## 3. Riwayat sesi kronologis (apa yang dibangun & keputusan kunci)

Sesi ini membangun seluruh aplikasi dari nol (folder awalnya hanya berisi `PRD.md` + `UI_DESIGN_PNG/`). Urutan pengerjaan:

### 3.1 Landing page
- Scaffold Next.js 16.4 (App Router, TS, Tailwind v4, Turbopack) dengan `create-next-app` di subfolder lalu dipindah ke root (karena `PRD.md` memblokir scaffold langsung).
- Desain direplikasi dari `UI_DESIGN_PNG/Landing Page.png`: Navbar (dropdown Products), Hero "Meet ⊙ Tera", mockup produk (stepper + chat statis), band testimoni dengan lingkaran smiley, grid fitur 2×2 ("Terang.in Mudah Dipakai"), Pricing Rp 15k/Sesi, wordmark raksasa TERANG.IN (SVG `textLength` agar full-width), cookie banner floating.
- **Keputusan desain:** tema gelap `#050505` + kartu `#161616`, font Inter, tombol pill putih, animasi scroll Framer Motion (`motion` v14) yang menghormati `prefers-reduced-motion`.
- **Nama brand:** "Terang.in" (bukan "Terangin.in") — user mengoreksi; semua copy memakai ini.
- **Avatar Tera (TeraMark):** awalnya crescent bulan, lalu diminta "avatar mirip Grok" (dicoba glyph Grok), akhirnya **dikoreksi jadi karakter lingkaran putih dengan dua mata melengkung** (sama dengan avatar besar di section testimoni). Ditambah **mata mengikuti cursor** (spring) dan **animasi kedip** (scaleY mata menyipit tiap ~4 detik).
- **Kebijakan anti AI-slop** (permintaan eksplisit user, berlaku global): dilarang em dash (—), en dash, panah teks (→ ←), middot (·), emoji, dan karakter "slop" lain di seluruh copy UI. Panah hanya boleh berupa ikon SVG. Ada perintah grep audit di §7.
- **Demo landing = UI app asli (lanjutan):** `ProductPreview` kini mereplikasi AppShell — `StepList` asli dipakai dengan prop `demo` (non-klik, `aria-hidden`, sweep/garis/knob identik app) + `ChatDemo.tsx` scripted (header app, AI tanpa bubble, caret streaming, tombol Salin, input `rounded-2xl`) dan sequence sekali saat in-view (step advance → chat mengetik → settle, sweep terus berputar). 4 kartu fitur di `feature-mocks.tsx` disamakan dengan app (form onboarding, quiz dengan timer/Likert, hasil analisis dark-theme dengan match count-up, mini chat) — semua scripted tanpa AI call, reduced motion → langsung state akhir. Spinner "Asking Research..." + dot warna-warni dihapus.

### 3.2 Auth (Auth.js v5 beta + Drizzle)
- `next-auth@5.0.0-beta.32` + Credentials provider + **JWT session** (constraint: credentials hanya bisa JWT). Password di-hash `bcryptjs`. Validasi `zod`.
- `trustHost: true` di `auth.ts` — **wajib**; tanpa ini `next start` (production mode) gagal dengan `UntrustedHost` (dev mode auto-trust).
- Signup minimal (nama, email, password) → auto-login → redirect `/onboarding`. Login → `/dashboard`.
- Halaman login/signup minimalist, konsisten dengan landing.
- **Gotcha React 19:** form action me-reset field uncontrolled setelah submit (termasuk setelah error) — ini perilaku standar, bukan bug.

### 3.3 Database & schema
- PostgreSQL 18 lokal via Homebrew (`createdb terangin`, user `arcozkwn`, tanpa password). `DATABASE_URL=postgresql://arcozkwn@localhost:5432/terangin`.
- Drizzle ORM + `postgres.js` driver. Workflow sekarang memakai **versioned migrations** (`db:generate` + `db:migrate`, file di `db/migrations/` di-commit). `db:push` tinggal untuk prototyping lokal.
- DB lokal (`terangin`) sudah di-baseline (`drizzle.__drizzle_migrations` berisi 0000), jadi `db:migrate` aman dan no-op sampai ada migrasi baru.
- Seluruh 12 tabel PRD dibuat, plus kolom/constraint tambahan (lihat `architecture.md` §5).

### 3.4 Onboarding (Fase 1)
- `/onboarding`: sub-step 1 "Kenalan dulu" (sekolah, kelas 10/11/12, chip minat maks 5) → sub-step 2 tur 4 slide beranimasi → `completeOnboardingAction` → `/dashboard`.
- Resume otomatis: kalau sekolah+kelas sudah tersimpan, langsung lanjut ke tur.
- **App shell** dibangun di sini: sidebar dengan stepper 4 langkah (status di-derivasi dari DB), mengikuti mockup di landing.

### 3.5 Asesmen Minat & Bakat (Fase 2, langkah 2)
- 24 soal seed (`db/seed.ts`), 4 kategori × 6: MINAT (RIASEC), KEPRIBADIAN, BAKAT (aptitude ala Flanagan sebagai self-efficacy), GAYA_BELAJAR. Skala Likert 1–5.
- **Autosave per jawaban** (upsert, unique `(user_id, question_id)`), bisa ganti jawaban.
- **Timer 15 detik per soal** — state `Map<questionId, seconds>` di parent, **resume sisa waktu saat kembali** ke soal (bukan reset). Refresh halaman me-reset timer soal belum dijawab (keputusan user: in-memory saja).
- **Timeout = skip + kunci permanen:** soal tersimpan dengan `score = 0` (marker "tanpa data"), chip di grid jadi disabled, tahan refresh, tidak memblokir penyelesaian.
- **Grid navigasi 24 soal:** soal belum dibuka TIDAK bisa diakses (dashed, disabled); soal yang pernah dibuka (visited set), terjawab, terkunci, atau aktif bisa diklik.
- Fase finish: gating — "Simpan & proses" hanya muncul saat semua soal tertangani; kalau ada sisa, tombol "Kerjakan sisa soal".
- **Bug yang ditemukan & diperbaiki:** tombol "Lanjut" pernah melompat ke fase finish saat user meninjau ulang (kondisi `answeredCount === total` membalik perilaku tombol) — sekarang "Lanjut" selalu ke soal berikutnya; di soal terakhir jadi tombol "Selesai". Auto-advance juga diperbaiki dari stale closure (pakai `indexRef`).
- `restartAssessmentAction` untuk "Ulangi asesmen" (hapus jawaban + reset flag).

### 3.6 Input Nilai (Fase 2, langkah 3)
- `/nilai`: tab semester dinamis (chips + "+ Semester", cap 5; default per kelas: 10→smt 1-2, 11→1-4, 12→1-5), baris mapel dinamis per semester (chip preset 12 mapel umum + input custom dengan datalist), autosave per field (upsert, unique `(user_id, subject, semester)`), hapus baris, validasi 0–100, deteksi mapel duplikat per semester.
- **Superset Semester 1** (permintaan user): mapel yang tersimpan di Semester 1 muncul sebagai **baris saran (ghost rows)** di semester 2–5 — nama redup, input bergaris putus-putus, tombol "Lewati". Bukan record DB sampai diisi. Isi nilai → jadi baris normal. "Lewati" = dismiss sesi saja (tidak persist; muncul lagi setelah refresh — sesuai keputusan). Hapus nilai tersimpan yang asalnya dari Semester 1 → otomatis ter-dismiss di sesi itu. Mapel yang hanya ada di semester n tidak menular ke semester lain.
- Tombol "Selesai" eksplisit (`grades_completed_at`), halaman tetap bisa dibuka untuk edit (banner hijau).

### 3.7 Analisis AI (Fase 3)
> Catatan: deskripsi di bawah adalah versi awal. Sejak §3.13, skor & urutan dihitung kode (deterministik) dan LLM hanya menarasikan — prompt "13 prinsip" sudah digantikan prompt narasi.
- **Stack:** Vercel AI SDK v7 (`ai@7`) + `@ai-sdk/groq` + model **`openai/gpt-oss-120b`**.
- **Temuan penting:** Groq Structured Outputs (mode strict, constrained decoding) **tidak mendukung streaming** → generate blocking dengan UI progress bertahap beranimasi. Hasil generate hanya ~4 detik.
- Data kampus: **seed SQL kurasi** (`db/seed-colleges.ts`) — 12 jurusan, 10 kampus PTN/PTS, 34 relasi dengan daya tampung + estimasi UKT (ditandai "perkiraan" di UI). Tavily tidak dipakai (keputusan user).
- Prompt engineering: system prompt "Tera konselor" 13 prinsip (semua klaim merujuk data, validasi silang minat awal vs asesmen, match% realistis bervariasi, tanpa emoji/em dash, alasan menyebut data spesifik) + user prompt berisi agregat lengkap. `majorId` pakai `z.enum` dari ID di DB (anti-halusinasi) + post-validasi (dedupe, clamp 40–97, rank 1..n) + persist transaksional.
- `/analisis`: intro + ringkasan data → progress 4 tahap → hasil (tipe kepribadian + catatan keselarasan, ringkasan narasi, kekuatan + bar 4 kategori + mapel terkuat, 5 rekomendasi dengan match% + kampus/UKT, disclaimer). "Analisis ulang" mengganti hasil.
- `reasoningEffort: "medium"`.

### 3.8 Chat Tera (Fase 4)
- `/chat`: `useChat` (`@ai-sdk/react`) + `DefaultChatTransport` → `POST /api/chat` → `streamText` + `toUIMessageStream` + `onFinish` persist. Satu sesi per user (tabel PRD `chat_sessions`/`chat_messages`). Riwayat 50 pesan terakhir di-load server-side.
- Konteks personal dibangun segar per request (`lib/chat/context.ts`): profil, ringkasan asesmen, nilai, hasil analisis, + katalog kampus lengkap dari DB.
- **Grounding fix:** percobaan pertama model bilang "data UKT tidak tersedia" padahal ada di katalog → diperbaiki dengan instruksi eksplisit "wajib cek katalog dulu" + `reasoningEffort` naik ke medium. Sekarang jawaban menyebut angka dari DB dengan benar.
- UI ala Grok: user = bubble putih, AI = avatar + teks tanpa bubble, markdown ringan (react-markdown + remark-gfm), typing dots, auto-scroll pinned, input sticky dengan tombol panah-atas (berubah jadi stop saat streaming), kartu saran pertanyaan **personal** (dari rekomendasi rank 1).
- **Akses: setelah analisis selesai** (keputusan user — urutan ketat PRD).
- Sidebar: kartu "Chat sama Tera" (tile gradien violet persis mockup landing) tepat di atas kartu profil; terkunci redup sebelum analisis. Mobile: FAB bulat TeraMark kanan bawah (spring animation, hidden di `/chat` & saat terkunci).
- **Reset chat + polish UI (lanjutan):** header chat jadi sticky (blur) dengan kontrol reset inline dua langkah; konfirmasi memanggil `resetChatAction` (`lib/actions/chat.ts`) yang menghapus `chat_sessions` user (cascade ke `chat_messages`), setelah `stop()` bila sedang streaming, lalu `clearError()` + `setMessages([])` dengan exit animation. Polish ala Grok/Claude/ChatGPT: smart auto-scroll (scroll listener pada scroll container via `getScrollParent`, threshold 140px, hanya scroll saat dekat bawah; target `scrollHeight` container supaya konten tidak tertutup sticky footer) + tombol "ke pesan terbaru", aksi "Salin" per pesan AI (hover/focus reveal, feedback "Tersalin" 1.6 dtk), streaming caret 2px via CSS `.chat-streaming` di `globals.css`, bob halus TeraMark di empty state, focus glow + `whileTap` di input. Spec di `ui.md` §6.8/§7; action & komponen di `architecture.md` §7.4/§8.

### 3.9 Sidebar & navigasi (permintaan user di tengah sesi)
- **Bug fixed:** sidebar dulu ikut scroll saat konten panjang → sekarang app-shell pattern: `md:h-dvh md:overflow-hidden` + kolom konten `md:overflow-y-auto` (scrollbar di area konten, sidebar menetap, chip user + Keluar selalu terlihat).
- **StepList jadi menu navigasi:** tiap step = link (Profil/Assessment/Nilai/Analisis), highlight aktif mengikuti rute (`usePathname` + `aria-current`), fallback ke step journey aktif saat di `/dashboard`. Step terkunci = non-link (dimmed, `aria-disabled`). Versi mobile (stepper horizontal kompak) juga clickable.
- `/profil` dibuat sebagai halaman step 1 (edit data dasar + minat, tombol "Ulangi tur onboarding" yang me-reset flag → kembali ke tur).
- **Animasi StepList (lanjutan):** step aktif mendapat sweep outline (conic-gradient putih berotasi, desktop 4.5s / mobile 5.5s arc sempit), garis progress vertikal dinamis (fill gradient + knob glow di tepi atas kartu aktif, posisi px dari tinggi track via ResizeObserver, `z-10` di depan baris; disembunyikan saat semua step done), dan segmen horizontal mobile yang terisi. Presisi dijaga: row aktif pakai `shadow` ring (bukan border, agar tinggi tetap 60px) dan nav pakai `flex flex-col gap-1` (bukan `space-y-1`, agar track absolute tidak kena margin). Kotak nomor non-aktif opak `bg-[#161616]` (bukan `bg-white/6`) supaya garis tidak tembus di belakang angka; garis hanya terlihat di sela antar kotak. Spec lengkap di `ui.md` §5.1/§5.2/§7. Terverifikasi E2E: tinggi row uniform 60px, knob delta 0px dari tepi kartu, fill ratio persis, reduced motion statis, audit AI-slop bersih.

### 3.10 Guard halaman publik: sudah login selalu masuk dashboard
- Permintaan user: kalau sudah login, membuka website harus diarahkan ke `/dashboard`.
- Perubahan: `app/page.tsx`, `app/login/page.tsx`, dan `app/signup/page.tsx` memakai pola `export const instant = false` + `await connection()` + `auth()` → `redirect("/dashboard")` bila ada session. Ketiganya berubah dari PPR/Static menjadi dynamic (lihat tabel route di `architecture.md` §3).
- Keputusan: cabang logged-in di `AuthNav` (chip user + Keluar di landing) sengaja dibiarkan defensive walau praktis unreachable; keluar tetap bisa dari sidebar app. Tidak ada prefetch-cache pitfall: redirect terjadi server-side sebelum `AuthButtons` (berisi Link ke `/login` dan `/signup`) ter-render.
- Verifikasi: `npm run lint` + `npm run build` bersih; E2E Playwright 9/9 PASS (guest landing utuh, guest `/dashboard` → `/login`, signup → onboarding → dashboard, saat login buka `/` `/login` `/signup` → semuanya `/dashboard`, logout → `/` guest, lalu `/dashboard` → `/login`).

### 3.11 Validasi minimal 7 mapel per semester (input nilai)
- Permintaan user: jangan ada yang selesai input nilai dengan cuma 1-2 nilai; tiap semester minimal 7 mata pelajaran.
- Cakupan: semester wajib = default sesuai kelas (10: smt 1-2, 11: smt 1-4, 12: smt 1-5) ∪ semester yang sudah punya nilai; semester tambahan yang masih kosong tidak menghalangi.
- Implementasi: helper bersama di `lib/grades.ts` (`MIN_SUBJECTS_PER_SEMESTER`, `defaultSemestersFor`, `getRequiredSemesters`, `getSemesterShortfalls`, `formatShortfallMessage`). Client (`GradeInput`) memblokir tombol "Selesai" + hint amber berisi daftar semester yang kurang; server (`completeGradesAction`) memvalidasi ulang (sumber kebenaran) dan mengembalikan error rinci.
- Verifikasi: `npm run lint` + `npm run build` bersih; E2E Playwright 12/12 PASS (kelas 10: awal terkunci, smt 1 penuh → smt 2 masih dikunci, smt 2 berisi 3 → kurang 4, smt 2 penuh 7 → aktif, tab smt 3 kosong tidak menghalangi, selesai → DB 1:7 + 2:7 + flag terisi).

### 3.12 Pembatasan scope chat + protokol curhat + anti-drift
- Permintaan user: Tera harus tetap dalam konteks fungsi aplikasi (contoh: diminta "selesaikan kode C" harus ditolak halus), tapi curhat siswa tetap ditanggapi hangat.
- Prompt (`lib/chat/prompt.ts`) direstrukturisasi jadi 5 blok: PERAN DAN CAKUPAN (in-scope + out-of-scope eksplisit + formula penolakan + tetap tolak walau ditekan/dibungkus alasan/roleplay), CARA MENANGGAPI CURHAT (empati spesifik dulu, bukan terapis, indikasi krisis → orang dewasa/BK tanpa menyebut hotline), PEGANGAN SAAT USER BERCERITA (tidak membalik rekomendasi karena emosi sesaat, netral saat konflik ortu, bahasa probabilistik), SUMBER DATA (salin angka persis, baca baris kampus spesifik di katalog), GAYA BAHASA (karakter standar).
- Katalog pada konteks chat diformat ulang: satu kampus per baris di bawah nama jurusan (sebelumnya satu baris panjang dengan pemisah titik koma).
- `sanitizeChatText` (`lib/chat/text.ts`) baru: ganti em dash, en dash, non-breaking hyphen/space jadi ASCII; dipakai di `onFinish` (persist) dan render `ChatPanel`. Model tetap kadang menghasilkan karakter tipografis walau dilarang di prompt, jadi lapisan sanitasi ini wajib.
- `reasoningEffort` chat dinaikkan `medium` → `high` (dengan medium, kasus uji angka katalog salah 2 kali; dengan high benar).
- Temuan uji: model sempat mencampur daya tampung TI@UI (70) dengan SI@UI (55) saat baris katalog berdekatan. Fixed lewat format per-baris + instruksi baca baris + effort high.
- Verifikasi: `npm run lint` + `npm run build` bersih; E2E Playwright 12/12 PASS (5 kasus out-of-scope ditolak konsisten termasuk roleplay dan tekanan ulang; curhat nyambung ditangani empati + langkah; curhat tidak nyambung diarahkan balik; krisis → BK/orang dewasa tanpa hotline; angka katalog TI@UI 70 dan SI@UI 55 benar; tanpa emoji/em dash/NBH di semua respons).

### 3.13 Analisis deterministik: skor dihitung kode, LLM hanya menarasikan
- Permintaan user: rekomendasi jurusan harus jelas dasar perhitungannya (faktor apa saja, algoritma per segmen, pengaruh tiap faktor seberapa besar).
- Keputusan: skoring penuh di kode. Bobot tetap `FACTOR_WEIGHTS` (`lib/analysis/score.ts`): Minat 30%, Bakat 25%, Nilai rapor 20%, Kepribadian 15%, Gaya belajar 10%. Sub-skor tiap faktor 0-100 (dari `dimensionScores` hasil tag dimensi soal, dinormalisasi terhadap data yang tersedia); total = rata-rata berbobot dari faktor yang ada datanya (minimal 2 faktor); `match = clamp(40..97, 40 + 0.57 x total)`; peringkat diambil top 5.
- Data kurasi baru: `questions.dimension` (24 tag: RIASEC, aptitude, kepribadian, gaya belajar) dan `majors.profile` jsonb (bobot skoring per jurusan: riasec/aptitude/personality/learning/subjects). Kedua seed punya jalur update non-destruktif (tanpa --force) supaya jawaban user tidak terhapus. Kolom baru lain: `analysis_recommendations.factors` jsonb (rincian sub-skor).
- LLM (Groq) sekarang hanya menulis narasi: personalityType, summary, strengths, alignmentNote, dan reason per jurusan (wajib menyebut sub-skor); skema output hanya `{ majorId, reason }` dalam enum top 5. Ada fallback reason deterministik kalau LLM melewatkan satu jurusan. `details` menyimpan `weights` + `method: "deterministic-v1"`.
- UI: chip bobot faktor + panel sub-skor per rekomendasi (`FactorBreakdown`) di halaman hasil; hasil lama tanpa `factors` tetap tampil tanpa panel. Konteks chat ikut memuat sub-skor + bobot supaya Tera bisa menjelaskan angka (dan dilarang mengubahnya).
- Verifikasi: unit check rumus 7/7 PASS (angka hitung manual vs output; top-1 Teknik Informatika); E2E Playwright 10/10 PASS (alur analisis penuh + chip bobot + panel sub-skor + DB factors lengkap + match konsisten rumus + reproducible: dua kali run identik 87/84/83/82/81); lint + build bersih.
- Catatan: isi tag dimensi & profil jurusan adalah kurasi awal sesi ini (mudah diubah lewat seed karena murni data); minat awal onboarding sengaja tidak masuk rumus, perannya validasi silang di `alignmentNote`.

### 3.14 Housekeeping: state git & cakupan sesi
- Task 1-3 sesi ini (guard redirect halaman publik §3.10, validasi minimal 7 mapel §3.11, pembatasan scope chat §3.12) sudah di-commit user sebagai `c16fc03`.
- Task 4 (analisis deterministik §3.13) + seluruh update dokumentasi MASIH UNCOMMITTED saat dokumen ini ditulis. File yang terlibat: `lib/analysis/score.ts` (baru), `lib/analysis/prepare.ts`, `lib/analysis/prompt.ts`, `lib/analysis/schema.ts`, `lib/actions/analysis.ts`, `app/analisis/page.tsx`, `components/analysis/AnalysisPanel.tsx`, `lib/chat/context.ts`, `lib/chat/prompt.ts`, `db/schema.ts`, `db/seed.ts`, `db/seed-colleges.ts`, plus `architecture.md`, `continue.md`, `ui.md`.
- Semua sudah terverifikasi (lint/build bersih, unit check 7/7, E2E analisis 10/10). Saran pesan commit: "feat: analisis deterministik (skor berbobot + panel dasar penilaian)".
- Urutan kerja sesi ini: (1) guard halaman publik → (2) validasi minimal 7 mapel/semester → (3) pembatasan scope chat + protokol curhat → (4) analisis deterministik → (5) dump dokumentasi ini.
- Migrasi DB sesi ini: `db:push` (kolom baru: `questions.dimension`, `majors.profile`, `analysis_recommendations.factors`) lalu `db:seed` + `db:seed-colleges` lewat jalur non-destruktif (jawaban user lama tidak terhapus).

---

## 4. Gotcha & konvensi wajib (JANGAN ulangi kesalahan ini)

### 4.1 Next 16 `cacheComponents` + auth
`next.config.ts` mengaktifkan `cacheComponents: true`. Membaca session (`auth()` → cookies) di halaman membuat route error saat build/prerender **kecuali**:
- dibungkus `<Suspense>` (pola landing: `AuthNav` di-stream), atau
- halaman memakai `export const instant = false` + `await connection()` di awal (pola semua halaman app: onboarding, dashboard, assessment, nilai, analisis, profil, chat, dan kini juga `/` + `/login` + `/signup` untuk guard redirect).

**Bug yang pernah muncul:** `crypto.getRandomValues() while prerendering` (dari Auth.js saat re-encode JWT) di route ber-session → fixed dengan `await connection()` sebelum `auth()`. Jangan hapus pemanggilan `connection()` ini.

### 4.2 Prefetch-cache redirect pitfall (PENTING)
Link ke route ber-guard yang di-render **sebelum** prasyaratnya terpenuhi akan di-prefetch Next → guard me-redirect → hasil redirect ter-cache di router client → klik setelah prasyarat terpenuhi tetap salah arah. **Aturan: jangan render `<Link>` ke route ber-guard sebelum prasyaratnya selesai.** Terapkan dengan render kondisional:
- Kartu dashboard: prasyarat belum → `<span>` terkunci ("Selesaikan X dulu"), bukan Link.
- StepList: step "todo" → `<span aria-disabled>`, bukan Link.
- ChatMenuCard: sebelum analisis → div terkunci, bukan Link.

### 4.3 ESLint react-hooks (Next 16 config ketat)
Rule `react-hooks/set-state-in-effect` menolak `setState` sinkron di body `useEffect`. Pola yang lolos:
- setState di dalam callback interval/timeout (bukan body effect).
- Reset state di event handler (mis. `setStage(0)` di `run()`, bukan di effect).
- Untuk sync eksternal (localStorage) pakai `useSyncExternalStore` (lihat `CookieBanner`).
- Efek yang memanggil fungsi async (setState terjadi setelah `await`) aman.

### 4.4 Kebijakan anti AI-slop (global, semua copy)
Dilarang di copy UI: em dash `—`, en dash `–`, panah teks `→ ←`, middot `·`, emoji, klise. Audit sebelum selesai:
```bash
grep -rn -E "—|–|→|←|· " app components lib --include="*.tsx" --include="*.ts" | grep -v "Math\|=>" || echo "CLEAN slop"
```
Model AI (analisis & chat) juga diinstruksikan tanpa emoji & em dash di system prompt — jangan hapus aturan itu. Untuk chat, ada lapisan tambahan `sanitizeChatText` (`lib/chat/text.ts`) karena model terbukti tetap menghasilkan karakter tipografis (em dash U+2014, non-breaking hyphen U+2011) walau sudah dilarang — jangan andalkan prompt saja.

### 4.5 Groq
- Structured outputs: mode strict, **semua field wajib required**, dan **tidak bisa streaming** (streaming + structured outputs belum didukung Groq). Chat streaming biasa (teks) aman.
- Model: `openai/gpt-oss-120b`. `reasoningEffort`: **chat `high`** (akurasi angka katalog; dengan medium pernah salah 2 kali di kasus yang sama), **analisis `medium`** (tugasnya kini hanya menarasikan skor yang sudah dihitung kode).
- `GROQ_API_KEY` di `.env.local` — kalau kosong, action analisis mengembalikan error ramah (bukan crash).

### 4.6 Drizzle + postgres.js
- Upsert (`onConflictDoUpdate`) butuh unique constraint di schema — sudah dipasang untuk `user_assessment_answers` dan `academic_records`.
- Transaksi: `db.transaction(async (tx) => {...})` (dipakai di persist analisis).
- `decimal` dibaca sebagai string dari DB — konversi dengan `Number()` saat menampilkan/menghitung.
- Seeding idempotent: skip kalau tabel sudah terisi; `--force` untuk isi ulang (dengan peringatan cascade).
- Migrasi: `drizzle-kit generate` menulis `db/migrations/` (SQL + snapshot + journal) yang wajib di-commit. `scripts/migrate.ts` membaca file itu dan mencatat hash sha256 + timestamp di `drizzle.__drizzle_migrations`; migrasi di-skip kalau `created_at` terakhir >= `when` di journal. **Jangan edit file migrasi yang sudah teraplikasi** (hash berubah dan migrasi baru bisa terlewat). DB yang sudah terisi schema harus di-baseline sekali (`scripts/baseline.ts`) supaya `migrate` tidak mencoba membuat ulang tabel.

### 4.7 Auth.js
- `trustHost: true` wajib (production mode lokal).
- Credentials + adapter DB tidak dipakai — user table sendiri, session JWT.
- `signIn` di server action dengan `redirectTo` → throw `NEXT_REDIRECT`; jangan catch kecuali `AuthError` (rethrow yang lain).

### 4.8 Testing pattern
- Playwright pakai **`playwright-core` + Chrome sistem** (`chromium.launch({ channel: "chrome" })`, fallback `"msedge"`), di-install sementara (`npm i -D playwright-core`) lalu **di-uninstall setelah selesai** agar deps tetap bersih.
- **Windows (mesin saat ini):** server dev user biasanya jalan di port 3000 — JANGAN dibunuh. Verifikasi memakai server produksi di port lain: `$env:PORT="3131"; npm run start`. Kill by port: `Get-NetTCPConnection -LocalPort 3131 -State Listen` → `Stop-Process -Id`. `psql`/`pg_isready` tidak ada di PATH — inspeksi DB pakai skrip node kecil (`@next/env` loadEnvConfig + `postgres`).
- Skrip E2E ditulis sebagai file `.mjs` di root repo (inline `node -e` rusak karena quoting PowerShell), dijalankan dari repo agar `playwright-core`/`postgres` resolve, lalu **dihapus** setelah selesai. Skrip boleh langsung setup/cek DB via postgres.
- `npm install/uninstall` mengubah `package-lock.json` (normalisasi npm) → kembalikan dengan `git checkout -- package-lock.json` bila tidak ingin lock tercampur ke commit.
- Skrip `.ts` via `npx tsx` perlu dibungkus `async function main()` (tsx default CJS, top-level await tidak didukung).
- **Pitfall test yang pernah bikin false alarm (bukan bug app):** setelah reload, `activeSemester` di `/nilai` kembali ke Semester 1 (state client); selector Playwright ambigu ("Soal 1" juga cocok "Soal 10" — pakai exact/regex); teks `main` mencakup riwayat lama (cek pesan terakhir via DB untuk verifikasi presisi); animasi tour onboarding butuh jeda kecil antar klik "Lanjut".

### 4.9 Analisis deterministik & data kurasi
- Skor dan urutan rekomendasi **bukan dari LLM**. `buildAnalysisSchema` hanya boleh menghasilkan `{ majorId, reason }` (+ field narasi lain); jangan tambahkan kembali `matchPercentage`/`rankOrder` ke output model.
- `FACTOR_WEIGHTS` (`lib/analysis/score.ts`) = satu-satunya sumber bobot (30/25/20/15/10). Kalau diubah: update chip bobot UI (`AnalysisPanel` memakai konstanta ini), dokumentasi, dan ulangi unit check rumus.
- Normalisasi: faktor tanpa data di-renormalisasi (bukan dianggap 0); minimal 2 faktor agar total dihitung; soal skip (score 0) tidak ikut `dimensionScores`.
- Menambah soal asesmen baru: WAJIB isi `dimension` (nama unik, lihat daftar di `db/seed.ts`) supaya ikut skoring; soal tanpa dimensi hanya masuk rata-rata kategori.
- Menambah jurusan baru: isi `profile` (riasec/aptitude/personality/learning/subjects) di `db/seed-colleges.ts`; jurusan tanpa profil tidak akan pernah masuk rekomendasi.
- Katalog konteks chat HARUS tetap satu kampus per baris (`lib/chat/context.ts`); pernah terjadi model mencampur angka dua jurusan satu kampus (TI@UI 70 vs SI@UI 55) saat baris dirapatkan.

---

## 5. Environment & perintah

**`.env.local`** (tidak di-commit; `.env*` di-gitignore):
```
DATABASE_URL=postgresql://arcozkwn@localhost:5432/terangin
AUTH_SECRET=<openssl rand -base64 33>
GROQ_API_KEY=gsk_...
```

**Postgres lokal:** di mesin Windows saat ini, `DATABASE_URL` di `.env.local` menunjuk Postgres lokal yang berjalan di port 5432 (cek cepat: `Test-NetConnection localhost -Port 5432`). `psql`/`pg_isready` tidak tersedia di PATH — inspeksi DB pakai skrip node kecil (lihat §7). Catatan mesin asal (Mac): Homebrew `postgresql@18`, user OS `arcozkwn`. Setup dari nol: `createdb terangin` → `npm run db:push` → `npm run db:seed` → `npm run db:seed-colleges`.

**Script npm:**
```
npm run dev / build / start / lint
npm run db:generate        # buat migrasi baru dari perubahan db/schema.ts (commit hasilnya)
npm run db:migrate         # terapkan migrasi (tsx scripts/migrate.ts)
npm run db:baseline        # tandai migrasi existing applied tanpa dijalankan (sekali, untuk DB lama)
npm run db:push            # sync schema langsung, hanya prototyping lokal
npm run db:seed            # 24 soal asesmen (idempotent, --force untuk ulang)
npm run db:seed-colleges   # 12 jurusan + 10 kampus + 34 relasi (idempotent, --force)
```

**Pipeline DB production (Vercel):** `package.json` punya script `vercel-build` = `tsx scripts/migrate.ts && next build`. Vercel otomatis memakainya, sehingga setiap deploy menjalankan migrasi dulu sebelum kode baru melayani traffic. `scripts/migrate.ts` hanya jalan saat `VERCEL_ENV=production` (preview di-skip; override `FORCE_MIGRATE=1`). Prod DB yang sudah terisi schema cukup di-baseline sekali: `DATABASE_URL=<prod> npm run db:baseline`. Jangan pernah mengedit file migrasi yang sudah teraplikasi (hash sha256 file dipakai sebagai penanda di `drizzle.__drizzle_migrations`).

**Alur dev:** `npm run dev` → http://localhost:3000. Untuk verifikasi produksi: `npm run build && npm run start`.

**Catatan port (mesin ini):** dev server user biasanya menempati port 3000 — untuk verifikasi otomatis jalankan server produksi di port lain (`$env:PORT="3131"; npm run start`) dan matikan berdasarkan port setelah selesai.

---

## 6. Akun & data test

**Kondisi mesin Windows saat ini:** tabel `users` hanya berisi akun milik user (`michaelkevin3112@gmail.com`, `bloxfruit737@gmail.com`) — JANGAN disentuh. Akun test yang dibuat skrip E2E selalu dihapus di blok `finally` (delete by email + cascade). Akun test era mesin Mac (`tera.*@example.com`) tidak ada di mesin ini.

**Resep membuat user uji lengkap (instan, via DB)** — pola yang dipakai skrip E2E sesi ini:
1. Signup + onboarding lewat UI (atau insert manual) → ambil `select id from users where email = '<email uji>'`.
2. Set flag: `update users set assessment_completed_at = now(), grades_completed_at = now() where id = ...` (`onboarding_completed_at` terisi otomatis dari alur UI).
3. Insert jawaban asesmen per dimensi (soal sudah ber-tag `dimension`). Fixture yang dipakai verifikasi analisis deterministik (skor 1-5):

| Dimensi | Skor | Dimensi | Skor | Dimensi | Skor | Dimensi | Skor |
|---|---|---|---|---|---|---|---|
| I | 5 | numerik | 5 | sosial | 2 | visual | 3 |
| A | 3 | verbal | 4 | terencana | 4 | auditori | 2 |
| S | 3 | spasial | 3 | pemberani | 3 | praktik | 3 |
| E | 2 | mekanikal | 3 | tangguh | 4 | latihan | 4 |
| C | 3 | data | 5 | kolaboratif | 3 | mandiri | 4 |
| R | 2 | memori | 3 | rasional | 5 | diskusi | 2 |

   Plus nilai rapor smt 1: Matematika 92, Informatika 90, Fisika 85, Bahasa Inggris 80, Bahasa Indonesia 78, Biologi 70, Kimia 65. Fixture ini menghasilkan top-5: TI 87, Kedokteran 84, Sistem Informasi 83, Akuntansi 82, Teknik Elektro 81.
4. Untuk tes chat tanpa menjalankan analisis manual: insert `analysis_results` + `analysis_recommendations` (pakai `major_id` asli dari tabel `majors`) — pola ini dipakai di E2E chat.
5. Cleanup: `delete from users where email = '<email uji>'` (cascade ke jawaban, nilai, analisis, chat, action plans).

Password akun yang kita buat: `password123`.

**Data seed:** 24 soal (6×4 kategori, semua ber-`dimension`), 12 jurusan (semua ber-`profile`), 10 kampus (8 PTN + 2 PTS), 34 relasi kampus-jurusan dengan daya tampung + estimasi UKT.

---

## 7. Cara verifikasi (pola E2E di mesin Windows ini)

Aturan main: dev server user biasanya di port 3000 (jangan diganggu). Verifikasi memakai build produksi di port **3131**.

```powershell
# 1. Build + jalankan server verifikasi (background)
npm run build
$env:PORT="3131"; npm run start   # jalankan sebagai background job

# readiness: loop sampai HTTP 200
$ok=$false; for($i=0;$i -lt 30;$i++){ try { $r=Invoke-WebRequest http://localhost:3131 -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break} } catch {}; Start-Sleep -Milliseconds 500 }; if($ok){"READY"}else{"NOT READY"}

# 2. Playwright sementara
npm i -D playwright-core

# 3. Jalankan skrip E2E sebagai file .mjs (hindari inline -e; quoting PowerShell bermasalah)
#    Pola: chromium.launch({ channel: "chrome", headless: true }) fallback "msedge"
#    Skrip boleh langsung import postgres + @next/env untuk setup/cek DB (lihat resep §6)
node e2e-xxx.mjs

# 4. Cek DB tanpa psql (tidak ada di PATH): pakai skrip node kecil, atau jadikan bagian akhir skrip E2E

# 5. Cleanup WAJIB
Remove-Item e2e-xxx.mjs -Force
npm uninstall playwright-core
$procId = (Get-NetTCPConnection -LocalPort 3131 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess); if ($procId) { Stop-Process -Id $procId -Force }
git checkout -- package-lock.json   # opsional: buang normalisasi lock dari npm install/uninstall
```

- Unit check rumus skoring: skrip `.ts` dijalankan `npx tsx unit-xxx.ts` (bungkus `async function main()` karena tsx default CJS); hapus setelah selesai.
- Akun uji dibuat via signup UI di dalam skrip dan dihapus by email di blok `finally`; jangan tinggalkan user test.
- **AI nyata:** chat & analisis butuh `GROQ_API_KEY` valid di `.env.local`. Kalau tidak ada, verifikasi sampai error handling-nya saja.

---

## 8. Open items / next steps

1. **Fase 5: Rencana Aksi** — tabel `action_plans` sudah ada (`final_univ_major_id` FK ke `university_majors`, `roadmap_json`, `confidence_score` 1–100, `status` DRAFT/FINALIZED). Yang perlu dibangun: UI memilih 1–3 jurusan final dari rekomendasi, generate roadmap persiapan (AI, simpan ke `roadmap_json`), evaluasi keyakinan (slider/kuis singkat → `confidence_score`), finalize.
2. **Fase 6: Hasil Akhir** — halaman ringkasan dokumen personal (analisis + dialog + roadmap), tombol unduh (PDF/print) & bagikan ke orang tua/guru BK.
3. **Chat lanjutan** — multi-sesi (list sesi + judul), pagination riwayat (>50 pesan), mungkin regenerate/retry per pesan.
4. **Opsional (dari PRD)** — integrasi Tavily untuk data kampus live; faktor ekonomi wilayah; beasiswa terstruktur.
5. **Opsional teknis** — `not-found.tsx` & `error.tsx` kustom, rate limiting chat/analisis, halaman pengaturan akun, `proxy.ts` (middleware) untuk proteksi route (saat ini guard ada di masing-masing page).
6. **Deployment** — Vercel: set env Production (`DATABASE_URL` cloud seperti Neon pakai URL direct/unpooled untuk migrasi, `AUTH_SECRET`, `GROQ_API_KEY`), `trustHost` sudah aman, `maxDuration` chat = 60s (perhatikan limit plan). Migrasi otomatis via `vercel-build` → cukup baseline prod sekali (`DATABASE_URL=<prod> npm run db:baseline`) lalu push. Cek hasil: `select * from drizzle.__drizzle_migrations`.

---

## 9. Peta dokumen

- `PRD.md` — spesifikasi produk & schema asli (sumber kebenaran)
- `continue.md` (ini) — handoff sesi, status, keputusan, gotcha, next steps
- `architecture.md` — techstack, struktur file lengkap, fungsi kunci, AI pipeline, data layer
- `ui.md` — design tokens, spesifikasi komponen, peta UI per halaman, copywriting
- `UI_DESIGN_PNG/Landing Page.png` — referensi desain landing
- `AGENTS.md` — aturan Next.js lokal (dibuat otomatis oleh `next dev`; jangan dihapus)
