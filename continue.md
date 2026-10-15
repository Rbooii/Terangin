# continue.md — Handoff Sesi Terang.in

> **Untuk agent berikutnya:** baca dokumen ini dulu untuk memahami state terkini, riwayat keputusan, dan gotcha yang sudah ditemukan. Lanjut ke `architecture.md` untuk struktur teknis (file, fungsi, schema, AI pipeline) dan `ui.md` untuk design system. `PRD.md` adalah sumber kebenaran produk. Seluruh kode sudah ada di repo ini dan build-nya bersih — jangan membangun ulang dari nol, cukup lanjutkan dari state ini.

---

## 1. Apa ini

**Terang.in** adalah platform analisis + AI chatbot untuk membantu siswa SMA menentukan jurusan kuliah dengan sadar. Fitur inti per PRD: asesmen minat/bakat/kepribadian/gaya belajar, input nilai rapor, analisis AI yang mencocokkan minat vs kemampuan, chatbot personal "Tera" yang menjawab dengan data kampus nyata dari database, dan (belum diimplementasi) rencana aksi final.

Aplikasi terdiri dari:
- **Landing page publik** (`/`) yang direplikasi 1:1 dari desain `UI_DESIGN_PNG/Landing Page.png`
- **Alur produk 5 langkah** untuk user login: Onboarding → Asesmen → Input Nilai → Hasil Analisis → Chat dengan Tera

---

## 2. Status terkini (per akhir sesi ini)

| # | Fitur | Status | Verifikasi |
|---|-------|--------|------------|
| — | Landing page (9 section) | ✅ Selesai | Screenshot desktop/mobile vs PNG desain |
| — | Auth (signup/login/logout, session) | ✅ Selesai | E2E penuh |
| 1 | Onboarding (data dasar + tur 4 slide) | ✅ Selesai | E2E penuh |
| 2a | Asesmen Minat & Bakat (24 soal) | ✅ Selesai | E2E penuh + cek DB |
| 2b | Input Nilai (dinamis per semester) | ✅ Selesai | E2E penuh + cek DB |
| 3 | Hasil Analisis (AI Groq) | ✅ Selesai | E2E dengan AI sungguhan (4 detik generate) |
| 4 | Chat Tera (streaming AI) | ✅ Selesai | E2E AI nyata + cek DB |
| 5 | Action Plan / Rencana Aksi | ❌ **Belum** | Tabel `action_plans` sudah ada |
| 6 | Hasil Akhir (export/share) | ❌ **Belum** | — |

**Kualitas saat ini:** `npm run lint` bersih, `npm run build` bersih (semua route ter-render), audit AI-slop bersih, semua flow terverifikasi E2E dengan Playwright + Chrome sistem.

**Kondisi database:** semua tabel ter-push, seed lengkap (24 soal, 12 jurusan, 10 kampus, 34 relasi kampus-jurusan). Ada user test lengkap (lihat §6).

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

### 3.9 Sidebar & navigasi (permintaan user di tengah sesi)
- **Bug fixed:** sidebar dulu ikut scroll saat konten panjang → sekarang app-shell pattern: `md:h-dvh md:overflow-hidden` + kolom konten `md:overflow-y-auto` (scrollbar di area konten, sidebar menetap, chip user + Keluar selalu terlihat).
- **StepList jadi menu navigasi:** tiap step = link (Profil/Assessment/Nilai/Analisis), highlight aktif mengikuti rute (`usePathname` + `aria-current`), fallback ke step journey aktif saat di `/dashboard`. Step terkunci = non-link (dimmed, `aria-disabled`). Versi mobile (stepper horizontal kompak) juga clickable.
- `/profil` dibuat sebagai halaman step 1 (edit data dasar + minat, tombol "Ulangi tur onboarding" yang me-reset flag → kembali ke tur).

---

## 4. Gotcha & konvensi wajib (JANGAN ulangi kesalahan ini)

### 4.1 Next 16 `cacheComponents` + auth
`next.config.ts` mengaktifkan `cacheComponents: true`. Membaca session (`auth()` → cookies) di halaman membuat route error saat build/prerender **kecuali**:
- dibungkus `<Suspense>` (pola landing: `AuthNav` di-stream), atau
- halaman memakai `export const instant = false` + `await connection()` di awal (pola semua halaman app: onboarding, dashboard, assessment, nilai, analisis, profil, chat).

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
Model AI (analisis & chat) juga diinstruksikan tanpa emoji & em dash di system prompt — jangan hapus aturan itu.

### 4.5 Groq
- Structured outputs: mode strict, **semua field wajib required**, dan **tidak bisa streaming** (streaming + structured outputs belum didukung Groq). Chat streaming biasa (teks) aman.
- Model: `openai/gpt-oss-120b` (murah, cepat ~500 tps). `reasoningEffort`: analysis medium, chat medium.
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
- Playwright dipakai dengan **`playwright-core` + Chrome sistem** (`channel: "chrome"`), di-install sementara (`npm i -D playwright-core`) lalu **di-uninstall setelah selesai** agar deps tetap bersih sesuai stack.
- Server: `lsof -ti:3000 | xargs kill` → `npm run build` → `(npm run start >/tmp/terangin-server.log 2>&1 &)`.
- Screenshot disimpan ke `/var/folders/_3/54x2lq551ws0v9146ddt1nsr0000gn/T/opencode/`.
- **Pitfall test yang pernah bikin false alarm (bukan bug app):** setelah reload, `activeSemester` di `/nilai` kembali ke Semester 1 (state client); selector Playwright ambigu ("Soal 1" juga cocok "Soal 10" — pakai exact/regex); teks `main` mencakup riwayat lama (cek pesan terakhir via DB untuk verifikasi presisi).

---

## 5. Environment & perintah

**`.env.local`** (tidak di-commit; `.env*` di-gitignore):
```
DATABASE_URL=postgresql://arcozkwn@localhost:5432/terangin
AUTH_SECRET=<openssl rand -base64 33>
GROQ_API_KEY=gsk_...
```

**Postgres lokal:** Homebrew `postgresql@18`, database `terangin` (user OS `arcozkwn`, trust auth lokal). Pastikan service jalan: `pg_isready`. Setup pertama: `createdb terangin` → `npm run db:push` → `npm run db:seed` → `npm run db:seed-colleges`.

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

---

## 6. Akun & data test

Semua akun test password: **`password123`**.

| Email | Kelas | Onboarding | Asesmen | Nilai | Analisis | Kegunaan |
|-------|-------|-----------|---------|-------|----------|----------|
| `tera.nilai3.1791999472662@example.com` | 10 | ✅ | ✅ | ✅ | ✅ | **Akun utama E2E** — journey lengkap + riwayat chat + hasil analisis |
| `tera.sb.1792000221789@example.com` | 12 | ✅ | ✅ | ❌ | ❌ | Test locked state (kartu nilai/analisis/chat terkunci) |
| `tera.nilai2.1791999298780@example.com` | 10 | ✅ | ✅ | ❌ | ❌ | Guard `/nilai` |
| `tera.v5.1791998507381@example.com` | 12 | ✅ | ❌ | ❌ | ❌ | Guard `/assessment` |
| `tera.v4.1791998376057@example.com` | 12 | ✅ | ❌ | ❌ | ❌ | Sama seperti v5 |
| `mekel@gmail.com` | 12 | ✅ | ✅ | ✅ | ✅ | Akun manual milik user (password tidak diketahui) |

**Reset data user** (bank soal & katalog kampus tetap): 
```sql
TRUNCATE TABLE users CASCADE;  -- cascade ke jawaban, nilai, analisis, chat, action plans
```

**Data seed:** 24 soal (6×4 kategori), 12 jurusan, 10 kampus (8 PTN + 2 PTS), 34 relasi kampus-jurusan dengan daya tampung + estimasi UKT.

---

## 7. Cara verifikasi (pola E2E)

```bash
# 1. Pastikan build terbaru & server jalan
lsof -ti:3000 | xargs kill 2>/dev/null
npm run build && (npm run start >/tmp/terangin-server.log 2>&1 &) ; sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000

# 2. Install playwright sementara
npm i -D playwright-core

# 3. Jalankan skrip E2E (inline node --input-type=module)
#    Pola: chromium.launch({ channel: "chrome", headless: true })
#    Login pakai akun test §6, exercise flow, cek DB via psql

# 4. Cek DB contoh
psql -d terangin -c "select * from analysis_recommendations r join majors m on m.id=r.major_id order by rank_order;"

# 5. Cleanup WAJIB
npm uninstall playwright-core
lsof -ti:3000 | xargs kill 2>/dev/null
```

**AI nyata:** chat & analisis butuh `GROQ_API_KEY` valid. Kalau tidak ada, verifikasi sampai error handling-nya saja.

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
