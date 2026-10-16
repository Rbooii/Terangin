# architecture.md — Arsitektur & Struktur Project Terang.in

> Dokumen teknis lengkap: techstack, struktur file, fungsi kunci, data layer, integrasi AI, dan konvensi. Untuk status sesi & gotcha praktis baca `continue.md`; untuk design system baca `ui.md`; untuk spesifikasi produk baca `PRD.md`.

---

## 1. Ringkasan sistem

Terang.in adalah aplikasi **Next.js 16 (App Router)** full-stack satu repo: landing publik, alur produk 5 langkah ber-guard, dua endpoint AI (analisis: skoring deterministik di kode + narasi terstruktur Groq; chat: streaming), dan PostgreSQL via Drizzle. Tidak ada layanan eksternal selain **Groq API** (LLM).

```
Browser
  │
  ├─► Halaman publik (dynamic): "/", "/login", "/signup"
  │     sudah login → redirect /dashboard
  │
  ├─► Halaman app ber-guard (dynamic, instant=false):
  │     /onboarding → /dashboard → /assessment → /nilai → /analisis → /chat
  │     /profil (profil + ulangi tur)
  │       │
  │       ├─ Server Actions (mutasi: auth, onboarding, asesmen, nilai, profil, analisis)
  │       └─ fetch POST /api/chat (streaming NDJSON UI-message protocol)
  │
  ├─► /api/auth/[...nextauth] (Auth.js handlers: signin/signout/session)
  │
  └─► Groq API (openai/gpt-oss-120b)
        ├─ Analisis: generateText + Output.object (structured, non-streaming)
        └─ Chat: streamText (teks streaming)

PostgreSQL (Drizzle ORM + postgres.js)
  users · questions · user_assessment_answers · academic_records
  majors · universities · university_majors
  analysis_results · analysis_recommendations
  chat_sessions · chat_messages · action_plans
```

---

## 2. Techstack (versi aktual di `package.json`)

| Layer | Teknologi | Versi | Catatan pemakaian |
|-------|-----------|-------|-------------------|
| Framework | Next.js | 16.4.0 | App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true` |
| UI runtime | React | 19.3.0 | `useActionState`, form actions, reset otomatis field setelah action |
| Bahasa | TypeScript | ^5 | Strict via tsconfig bawaan create-next-app |
| Styling | Tailwind CSS | ^4 | Config-less (`@theme inline` di globals.css), `@tailwindcss/turbopack` |
| Animasi | motion (Framer Motion) | ^14.2.0 | `motion/react`, `useReducedMotion`, AnimatePresence |
| Auth | next-auth (Auth.js v5) | 5.0.0-beta.32 | Credentials + JWT session, `trustHost: true` |
| Hash password | bcryptjs | ^3.0.3 | cost 10 |
| Validasi | zod | ^4.6.7 | Schema di `lib/validation.ts` + output schema AI |
| ORM | drizzle-orm | ^0.45.4 | Schema-first, versioned migrations (`db:generate` → `db:migrate`) |
| Driver DB | postgres (postgres.js) | ^3.4.9 | Client singleton di `db/index.ts` |
| Database | PostgreSQL | 18 (Homebrew lokal) | DB `terangin` |
| AI SDK | ai | ^7.0.140 | `generateText`+`Output.object`, `streamText`, `convertToModelMessages`, `toUIMessageStream`, `createUIMessageStreamResponse` |
| AI provider | @ai-sdk/groq | ^4.0.60 | Model `openai/gpt-oss-120b` |
| AI client | @ai-sdk/react | ^4.0.143 | `useChat` + `DefaultChatTransport` |
| Markdown chat | react-markdown + remark-gfm | ^10.1.0 / ^4.0.1 | Render balasan AI, komponen di-map minimal |
| Seeder runner | tsx | ^4.23.15 | `db/seed.ts`, `db/seed-colleges.ts` |
| Lint | eslint + eslint-config-next | ^9 / 16.4.0 | Rule react-hooks ketat (lihat §10) |
| E2E (sementara) | playwright-core | — | Di-install saat verifikasi lalu di-uninstall |

**Alasan pemilihan (dari keputusan sesi):** Drizzle dipilih ketimbang Prisma karena lebih ringan (tanpa binary engine), TS-first, cocok serverless. `next-auth` beta karena jalur resmi App Router (catatan: Auth.js kini di bawah Better Auth, tapi v5 beta tetap yang dipakai). Groq `gpt-oss-120b` karena murah + cepat (~500 tps) + mendukung structured outputs mode strict.

---

## 3. Strategi rendering & routing

`next.config.ts`: `cacheComponents: true` + `partialPrefetching: true`.

| Route | Tipe | Guard / Catatan |
|-------|------|-----------------|
| `/` | ƒ Dynamic | `instant = false`; sudah login → redirect `/dashboard`; shell + `AuthNav` di balik `<Suspense>` dengan fallback `AuthButtons` |
| `/login`, `/signup` | ƒ Dynamic | `instant = false`; sudah login → redirect `/dashboard`; form client (`useActionState`) → server actions |
| `/onboarding` | ƒ Dynamic | `instant = false` + `connection()`; auth → profile → redirect `/dashboard` jika sudah selesai |
| `/dashboard` | ƒ Dynamic | + redirect `/onboarding` jika onboarding belum selesai |
| `/assessment` | ƒ Dynamic | + redirect `/onboarding`; jika sudah selesai tampilkan completed view |
| `/nilai` | ƒ Dynamic | + redirect `/assessment` |
| `/analisis` | ƒ Dynamic | + redirect `/nilai` |
| `/chat` | ƒ Dynamic | + redirect `/analisis` jika belum ada hasil analisis; akses chat wajib transaksi `PAID` dalam 5 hari terakhir (kedaluwarsa → tampilan terkunci + CTA ke `/analisis`) |
| `/profil` | ƒ Dynamic | + redirect `/onboarding` |
| `/api/auth/[...nextauth]` | ƒ Dynamic | `export const { GET, POST } = handlers` |
| `/api/chat` | ƒ Dynamic | POST saja; `export const maxDuration = 60` |

**Pola wajib halaman ber-session** (akibat `cacheComponents`):
```tsx
export const instant = false;

export default async function Page() {
  await connection();          // tandai request-time SEBELUM baca cookies
  const session = await auth();
  ...
}
```
Tanpa ini, build/runtime melempar `crypto.getRandomValues() while prerendering` (Auth.js re-encode JWT) atau error blocking-route.

**Prefetch rule:** jangan render `<Link>` ke route ber-guard sebelum prasyaratnya selesai (prefetch → redirect ter-cache → klik salah arah). Implementasi: CTA dashboard, StepList, dan ChatMenuCard semua kondisional (span terkunci vs Link).

### 3.1 Sistem tema (dark/light)
- Token semantik didefinisikan di `app/globals.css`: variabel `--theme-*` di `:root` (dark) dan `.light`, dipetakan ke Tailwind via `@theme inline` (`bg-surface`, `text-fg-muted`, `border-overlay/10`, dst. — semua nilai runtime, bukan baked).
- Pilihan user disimpan di localStorage `terangin-theme`; default mengikuti `prefers-color-scheme`. Script inline kecil di root layout (`app/layout.tsx`) menambahkan class `.light` ke `<html>` sebelum paint (anti-FOUC); `<html>` memakai `suppressHydrationWarning` karena class ini dimutasi sebelum hidrasi (tanpa itu React melaporkan hydration mismatch).
- `lib/theme.ts`: `setTheme` / `subscribeTheme` / snapshot untuk `useSyncExternalStore`; switch UI di `/akun` (`components/account/ThemeSwitch.tsx`).
- Aturan: komponen app tidak boleh memakai warna literal (`text-white`, `bg-[#161616]`, zinc-*, `white/alpha`); selalu pakai token. Halaman cetak (`/cetak/laporan`) pengecualian karena selalu light.

---

## 4. Auth & session

File `auth.ts` (root):
```ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,                       // WAJIB untuk next start lokal
  session: { strategy: "jwt" },          // credentials hanya bisa JWT
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (credentials) => {
      // zod parse → lowercase email → select user → bcrypt.compare
      // return { id, name: fullName, email } | null
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user?.id) token.id = user.id; return token; },
    session({ session, token }) { if (token.id) session.user.id = token.id; return session; },
  },
});
```

- Tipe augmentasi: `types/next-auth.d.ts` menambah `Session.user.id`.
- Adapter DB tidak dipakai (user table milik sendiri; OAuth belum ada).
- **Guard chain** di setiap page: `auth()` → `getUserProfile(userId)` → cek flag berurutan (`onboardingCompletedAt` → `assessmentCompletedAt` → `gradesCompletedAt` → `analysis_results` ada) → `redirect()` ke langkah yang kurang.

**Server actions auth** (`lib/actions/auth.ts`):
| Action | Input | Efek |
|--------|-------|------|
| `registerAction` | FormData (fullName, email, password) | zod → cek email unik → `bcrypt.hash` → insert user → `signIn(credentials, redirectTo: "/onboarding")` |
| `loginAction` | FormData (email, password) | `signIn(credentials, redirectTo: "/dashboard")`; `AuthError` → pesan "Email atau password salah" |
| `logoutAction` | — | `signOut({ redirectTo: "/" })` |

Semua `signIn` dipanggil server-side; `NEXT_REDIRECT` di-rethrow, hanya `AuthError` yang ditangkap.

---

## 5. Data layer

### 5.1 Koneksi (`db/index.ts`)
```ts
const client = globalForDb.postgresClient ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  connection: { TimeZone: "UTC" },   // WAJIB: jaga konsistensi naive timestamp (lihat §10)
});
export const db = drizzle(client, { schema });   // singleton via globalThis di non-production
```

### 5.2 Schema (`db/schema.ts`) — 12 tabel + 4 enum

**Enum:** `assessment_category` (MINAT, BAKAT, KEPRIBADIAN, GAYA_BELAJAR) · `university_type` (PTN, PTS, KEDINASAN, PTLN) · `sender_type` (USER, AI) · `action_plan_status` (DRAFT, FINALIZED) · `transaction_status` (PENDING, PAID, EXPIRED).

| Tabel | Kolom | Tambahan dari PRD |
|-------|-------|-------------------|
| `users` | id uuid PK, full_name, email unique, password_hash, school_origin, grade_level, created_at | + `initial_interests text[]`, + `onboarding_completed_at`, + `assessment_completed_at`, + `grades_completed_at` |
| `questions` | id, category enum, question_text | + `order_index int` (urutan kuis deterministik), + `dimension varchar(30)` (tag dimensi skoring: RIASEC/aptitude/kepribadian/gaya belajar) |
| `user_assessment_answers` | id, user_id FK cascade, question_id FK cascade, score int | + **unique(user_id, question_id)** untuk upsert; `score 0` = skip terkunci, `1-5` = jawaban |
| `academic_records` | id, user_id FK, subject varchar(50), semester int, score numeric(5,2) | + **unique(user_id, subject, semester)** untuk upsert |
| `majors` | id, name, description, career_prospects | + `profile jsonb` (bobot skoring per jurusan: riasec/aptitude/personality/learning/subjects) |
| `universities` | id, name, type enum, location | — |
| `university_majors` | id, university_id FK, major_id FK, capacity int (**null untuk PTLN**), estimated_tuition numeric(15,2) | + **unique `(university_id, major_id)`** (migrasi 0003, seed pakai `onConflictDoNothing`) |
| `analysis_results` | id, user_id FK **unique** (one-to-one), personality_type varchar(50), analysis_summary text, generated_at | + `details jsonb` (`{ strengths, alignmentNote, weights, method }`) |
| `analysis_recommendations` | id, user_id FK, major_id FK, match_percentage numeric(5,2), rank_order int | + `reason text`, + `factors jsonb` (rincian sub-skor deterministik per jurusan) |
| `chat_sessions` | id, user_id FK, started_at | — (satu sesi aktif per user) |
| `chat_messages` | id, session_id FK cascade, sender_type enum, content text, created_at | — |
| `action_plans` | id, user_id FK **unique**, final_univ_major_id FK university_majors, roadmap_json jsonb, confidence_score int, status enum | **Belum dipakai** (Fase 5) |
| `transactions` | id, user_id FK cascade, reference varchar(30) unique (`TRX-XXXXXXXX`), description varchar(100) default "Sesi analisis jurusan", amount int (15000), method varchar(20) default "QRIS", status enum, qris_payload text (EMV mock), used_at, created_at, paid_at, expires_at | Pembayaran QRIS mockup: 1 transaksi PAID = 1 kredit run analisis (`used_at` diisi saat analisis sukses dipersist); akses chat = 5 hari sejak `paid_at` terakhir |

**Catatan pembacaan:** kolom `decimal` dikembalikan sebagai **string** oleh driver → selalu `Number(...)` saat menghitung/menampilkan.

### 5.3 Migration & seeder
- `db/migrations/` (`npm run db:generate`): SQL versioned + `meta/_journal.json` + snapshot, di-commit ke git. Riwayat penerapan disimpan Drizzle di tabel `drizzle.__drizzle_migrations` (hash sha256 file + timestamp journal).
- `scripts/migrate.ts` (`npm run db:migrate`): runner migrasi terprogram (`drizzle-orm/postgres-js/migrator`) yang dimuat juga oleh `vercel-build`. Guard: skip kalau `VERCEL_ENV` ada dan bukan `production` (override `FORCE_MIGRATE=1`). Aman diulang, migrasi teraplikasi di-skip.
- `scripts/baseline.ts` (`npm run db:baseline`): sekali pakai untuk DB yang sudah terisi schema — tandai migrasi existing sebagai applied tanpa menjalankannya (abort kalau riwayat migrasi sudah ada).
- `db/seed.ts` (`npm run db:seed`): 24 soal asesmen (6 per kategori, Likert, RIASEC/Flanagan-inspired), idempotent (skip kalau `questions` terisi; `--force` hapus+isi ulang dengan peringatan cascade).
- `db/seed-colleges.ts` (`npm run db:seed-colleges`): 12 jurusan, **200 kampus** (100 PTN termasuk 24 UIN, 70 PTS, 30 PTLN), **131 relasi** `university_majors` terkurasi (10-12 kampus per jurusan; daya tampung + estimasi UKT, PTLN `capacity` null + estimasi biaya IDR per semester). Relasi di-link by-name setelah insert (map nama→id). Idempotent: jalur non-`--force` bersifat **sync non-destruktif** (update profil jurusan, insert kampus yang belum ada, refresh relasi); `--force` menghapus & isi ulang penuh. Relasi dibatasi sengaja agar katalog konteks chat tetap ringkas (naikkan hati-hati; lihat `continue.md` §4.9).
- `drizzle.config.ts`: `loadEnvConfig(process.cwd())` dari `@next/env` (agar `.env.local` terbaca drizzle-kit), dialect postgresql, schema `./db/schema.ts`, out `./db/migrations`.

---

## 6. Journey state machine (derivasi status langkah)

`lib/onboarding.ts`:

```ts
getUserProfile(userId) → row users | null

getJourneySteps(userId): Promise<JourneyStep[]>   // JourneyStep = { n, title, status, state: "done"|"active"|"todo" }
```
Status 4 langkah di-derivasi (bukan tabel terpisah):
1. **Onboarding** — done ⇔ `users.onboarding_completed_at != null`
2. **Assessment Bakat** — done ⇔ `users.assessment_completed_at != null`
3. **Input Nilai** — done ⇔ `users.grades_completed_at != null`
4. **Hasil Analisis** — done ⇔ ada row `analysis_results` untuk user

`activeIndex = index pertama yang belum done` → step itu ber-state `"active"` (dipakai StepList sebagai fallback highlight dan kartu dashboard).

---

## 7. Struktur file lengkap (per file: tanggung jawab & fungsi kunci)

```
terangin/
├── PRD.md / continue.md / ui.md / architecture.md / AGENTS.md
├── UI_DESIGN_PNG/Landing Page.png
├── auth.ts                     # Konfigurasi NextAuth (lihat §4)
├── drizzle.config.ts           # Konfigurasi drizzle-kit
├── next.config.ts              # cacheComponents + partialPrefetching + tailwind turbopack rule
├── .env.local                  # DATABASE_URL, AUTH_SECRET, GROQ_API_KEY (gitignored)
├── app/
│   ├── layout.tsx              # Inter font, metadata global, body flex dark
│   ├── globals.css             # @import tailwindcss + @theme inline font + bg #050505
│   ├── page.tsx                # Landing: komposisi 8 komponen + Suspense AuthNav
│   ├── signup/page.tsx         # Stub form signup (client form + server action)
│   ├── cetak/laporan/page.tsx  # Laporan lengkap A/B/C (asesmen + nilai + analisis), light, A4 print, tanpa AppShell
│   ├── akun/page.tsx           # Pengaturan akun: Tampilan (tema) + Zona bahaya (hapus akun)
│   ├── login/page.tsx          # Stub form login
│   ├── onboarding/page.tsx     # Guard chain awal; render BasicsForm | TourSlides
│   ├── dashboard/page.tsx      # Sapaan + chip profil + 4 kartu langkah (CTA kontekstual)
│   ├── assessment/page.tsx     # Guard + load bank soal & jawaban; render AssessmentFlow | completed view
│   ├── nilai/page.tsx          # Guard + load academic_records; render GradeInput
│   ├── analisis/page.tsx       # Guard + prepare data + load hasil tersimpan; render AnalysisPanel
│   ├── chat/page.tsx           # Guard (termasuk analisis); load 50 pesan terakhir; render ChatPanel
│   ├── profil/page.tsx         # Form profil + kartu "Ulangi tur"
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # export { GET, POST } = handlers
│       └── chat/route.ts                 # POST streaming chat + persist (lihat §9.2)
├── components/
│   ├── landing/                # Komponen landing + primitif bersama
│   │   ├── TeraMark.tsx        # Avatar (tracking cursor + blink + reduced motion) — dipakai di SELURUH app
│   │   ├── icons.tsx           # 10 ikon SVG stroke (ArrowRight/Down/Up, ChevronDown, Send, Sparkle, Trash, Check, Copy, Dashboard)
│   │   ├── FadeIn.tsx          # Wrapper motion whileInView (landing)
│   │   ├── Navbar.tsx          # Navbar + dropdown Products + slot authSlot
│   │   ├── AuthNav.tsx         # Server: auth() → AuthButtons | chip user + Keluar; ada connection()
│   │   ├── Hero.tsx / Testimonial.tsx / Pricing.tsx / Wordmark.tsx
│   │   ├── ProductPreview.tsx  # Mockup #preview: replika AppShell (StepList demo + ChatDemo) + sequence animasi scripted
│   │   ├── ChatDemo.tsx        # Chat scripted tanpa AI (dots → streaming + caret → copy), mirror visual ChatPanel
│   │   ├── Features.tsx        # Grid 2x2 kartu fitur (wrapper FeatureCard + FadeIn)
│   │   ├── feature-mocks.tsx   # 4 mini-mock app (onboarding, quiz, hasil analisis, chat) dengan sequence in-view
│   │   └── CookieBanner.tsx    # Consent localStorage via useSyncExternalStore
│   ├── app/
│   │   ├── AppShell.tsx        # Shell: sidebar (logo/StepList/ChatMenuCard/user/Keluar) + mobile header + ChatFab
│   │   ├── StepList.tsx        # Item Dashboard (Link /dashboard, di luar garis progress) + menu 4 langkah (client, usePathname, locked=non-link, prop `demo` untuk landing, 2 varian responsif)
│   │   ├── ChatMenuCard.tsx    # Kartu chat di sidebar (locked/unlocked/active)
│   │   └── ChatFab.tsx         # FAB mobile (spring, hidden di /chat & saat locked)
│   ├── auth/LoginForm.tsx · SignupForm.tsx      # Client useActionState; SignupForm export inputClass
│   ├── onboarding/BasicsForm.tsx                # Form sekolah/kelas/chip minat; export INTEREST_OPTIONS
│   ├── onboarding/TourSlides.tsx                # Tur 4 slide (AnimatePresence + dots)
│   ├── assessment/AssessmentFlow.tsx            # Mesin kuis lengkap (lihat §7.1)
│   ├── grades/GradeInput.tsx                    # Input nilai lengkap (lihat §7.2)
│   ├── analysis/AnalysisPanel.tsx               # Intro/progress/hasil analisis (lihat §7.3)
│   ├── chat/ChatPanel.tsx                       # UI chat (lihat §7.4)
│   ├── profile/ProfileForm.tsx                  # Edit profil + chips minat
│   ├── account/ThemeSwitch.tsx                  # Segmented Gelap/Terang (useSyncExternalStore + layoutId pill)
│   ├── account/DeleteAccountCard.tsx            # Zona bahaya: password + ketik HAPUS → deleteAccountAction
│   ├── account/TransactionHistory.tsx           # Kartu Transaksi /akun: list + expand struk + cetak (lihat §7.6)
│   ├── payment/QrisPlaceholder.tsx              # Pseudo-QR SVG deterministik dari payload (placeholder QRIS)
│   ├── payment/QrisPaymentFlow.tsx              # Alur bayar QRIS mockup: preparing/qr/verifying/paid + countdown (lihat §7.6)
│   └── cetak/PrintToolbar.tsx                   # Toolbar cetak laporan (Kembali ke /analisis + Cetak/Simpan PDF, print:hidden)
├── lib/
│   ├── validation.ts           # Semua schema zod (lihat §7.5) + deleteAccountSchema
│   ├── theme.ts                # Baca/tulis tema (localStorage terangin-theme) + subscribe untuk useSyncExternalStore
│   ├── grades.ts               # MIN_SUBJECTS_PER_SEMESTER, defaultSemestersFor, helper shortfall (lihat §7.2)
│   ├── onboarding.ts           # getUserProfile, getJourneySteps, tipe JourneyStep
│   ├── actions/
│   │   ├── auth.ts             # registerAction, loginAction, logoutAction
│   │   ├── onboarding.ts       # saveOnboardingAction (redirect resume), completeOnboardingAction
│   │   ├── assessment.ts       # saveAnswerAction, skipQuestionAction, completeAssessmentAction, restartAssessmentAction
│   │   ├── grades.ts           # saveGradeAction, deleteGradeAction, completeGradesAction
│   │   ├── profile.ts          # updateProfileAction, restartTourAction
│   │   ├── payment.ts          # createQrisTransactionAction, confirmPaymentAction (lihat §9.3)
│   │   └── analysis.ts         # runAnalysisAction (cek kredit sesi → skoring deterministik → narasi AI → persist transaksional + konsumsi kredit)
│   ├── assessment/
│   │   └── summary.ts          # DIMENSION_LABELS/CATEGORY_LABELS + computeDimensionScores + getAssessmentSummary (dokumen cetak)
│   ├── analysis/
│   │   ├── prepare.ts          # prepareAnalysisData(userId): agregasi lengkap + dimensionScores (lihat §9.1)
│   │   ├── prompt.ts           # buildSystemPrompt(), buildUserPrompt(data, ranked): prompt narasi
│   │   ├── score.ts            # scoreMajors + FACTOR_WEIGHTS: skoring deterministik (lihat §9.1)
│   │   └── schema.ts           # buildAnalysisSchema(top5Ids) → zod Output.object (narasi + reason per jurusan)
│   ├── chat/
│   │   ├── context.ts          # getUserChatContext(userId, focusText): konteks personal + katalog 4 kampus unggulan/jurusan (satu baris per kampus) + injeksi KAMPUS YANG DISEBUT USER (findMentionedUniversities, lihat §9.2)
│   │   ├── prompt.ts           # buildChatSystemPrompt(context): 5 blok (cakupan, curhat, pegangan cerita, data, gaya)
│   │   ├── messages.ts         # rowToUIMessage(row), extractMessageText(uiMessage)
│   │   └── text.ts             # sanitizeChatText: karakter tipografis non-ASCII jadi padanan standar
│   └── payment/
│       ├── index.ts            # PRICE_IDR, QR_TTL_MINUTES, CHAT_ACCESS_DAYS, formatRupiah/Countdown/Date, makeReference, buildQrisPayload, tipe view
│       ├── qr-placeholder.ts   # qrModules(payload): matriks pseudo-QR deterministik (seed FNV + xorshift, finder/timing/alignment)
│       └── queries.ts          # server-only: expireStaleTransactions, getPendingPayment, getAvailableCreditId, listTransactionViews, getChatAccess
├── db/
│   ├── schema.ts · index.ts · seed.ts · seed-colleges.ts
│   └── migrations/             # SQL migrasi versioned + meta/_journal.json (di-commit)
├── scripts/
│   ├── migrate.ts              # Runner migrasi (dipakai lokal & vercel-build, guard VERCEL_ENV)
│   └── baseline.ts             # Tandai migrasi existing applied (sekali, untuk DB lama)
└── types/next-auth.d.ts        # Augmentasi Session.user.id
```

### 7.1 `components/assessment/AssessmentFlow.tsx` — mesin kuis
State utama: `answers: Map<questionId, score>` (0 = terkunci), `timeLeft: Map<questionId, detik>` (in-memory, resume per kunjungan), `visited: Set<questionId>` (soal pernah dibuka → boleh diakses dari grid), `phase: "intro"|"quiz"|"finish"`, `index`, `saveState` (idle/saving/saved/error), `notice`.
- Timer: interval 1 dtk di parent (aktif saat fase quiz + soal belum dijawab + tidak saving); expire → `handleTimeout` (guard `skipInFlightRef`) → `skipQuestionAction` → map jadi 0 + notice amber 3 dtk → lanjut.
- Navigasi: `goTo(i)` (tambah visited), `goNext(from)` (lewati locked, -1 → finish), `prevOpenIndex`, `lastOpenIndex`, `firstUnansweredIndex`.
- Grid: chip disabled jika `isLocked || isUnopened` (`isUnopened = score === undefined && !isCurrent && !visited.has(id)`); aria-label "Soal N (terkunci/terjawab/belum dibuka)".
- Auto-advance setelah save (250ms) memakai `indexRef` (anti stale closure) dan hanya lanjut kalau masih di soal yang sama.
- Tombol bawah: "Kembali" (prev open) / "Lanjut" (selalu soal berikutnya) / "Selesai" di soal terakhir (aktif saat `allHandled`).

### 7.2 `components/grades/GradeInput.tsx` — input nilai
State: `semesters: number[]`, `activeSemester`, `rows: GradeRow[]` (`{ key, subject, score, semester, persisted, status, error }`), `dismissedGhosts: Set<"sem:subject">`, `ghostScores`, `ghostStates`, `lastAddedKey`.
- Derivasi superset: `semesterOneSubjects` (dari rows smt 1 persisted) → `ghostSubjects` untuk semester aktif (n≥2) = mapel smt 1 yang belum persisted di n dan belum dismissed → dirender sebagai baris saran (input dashed + tombol "Lewati").
- `saveRow` (upsert via `saveGradeAction`; validasi 0–100 + duplikat case-insensitive), `saveGhost` (sukses → materialize jadi row persisted + flash "Tersimpan"), `removeRow` (persisted → `deleteGradeAction` + auto-dismiss saran), `addRow`, `addSemester` (cap 5).
- Chip "Tambah cepat" = gabungan mapel smt 1 + preset, difilter terhadap baris/saran yang sedang tampil; `datalist` untuk saran nama.
- Aturan minimal: semester wajib = default kelas ∪ semester yang sudah punya nilai (semester tambahan kosong tidak wajib). `shortfalls` dihitung dari helper `lib/grades.ts`; tombol "Selesai" disabled selama ada semester <7, header kartu menampilkan "n/7" (amber saat kurang), footer menampilkan daftar shortfall.

### 7.3 `components/analysis/AnalysisPanel.tsx`
Props: `saved: SavedAnalysisView | null`, `stats: AnalysisStats`. State: `mode` (idle/running/error), `stage` (0–3, interval 2,2 dtk), `error`.
- `run()` → `runAnalysisAction()` → sukses → `router.refresh()` (server re-render; remount via `key={generatedAt}` → tampil hasil). Error → mode error + tombol "Coba lagi".
- Render hasil: kartu kepribadian + alignment note, ringkasan (split paragraf), kekuatan + 4 bar kategori + chip mapel, 5 rekomendasi (rank, match bar, alasan, panel `FactorBreakdown` dari `factors` jsonb, daftar kampus dengan `formatTuition`), chip bobot faktor di header rekomendasi, disclaimer.

### 7.4 `components/chat/ChatPanel.tsx`
- `useChat({ messages: initialMessages, transport: new DefaultChatTransport({ api: "/api/chat" }) })`.
- Header sticky (TeraMark + judul + subteks) di dalam panel, plus kontrol reset inline dua langkah → `resetChatAction` (stop stream dulu bila busy, lalu `clearError()` + `setMessages([])`).
- Smart auto-scroll: scroll listener pada scroll container terdekat (helper `getScrollParent`, fallback window) mengatur `atBottom` dengan threshold 140px; auto-scroll hanya saat dekat bawah, scroll ke `scrollHeight` container (menghindari konten tertutup sticky footer), `behavior: "instant"` saat load/streaming dan `"smooth"` saat idle; tombol "ke pesan terbaru" (ChevronDown) muncul saat `!atBottom`.
- `submit(text)` → `sendMessage({ text })`; Enter kirim, Shift+Enter newline; textarea auto-grow (cap 128px).
- Render: markdown AI via `ReactMarkdown` + `markdownComponents` (p/h/strong/ul/ol/li/a/code/pre/blockquote/table di-map ke styling minimal); streaming caret via `.chat-streaming`; aksi salin per pesan AI (hover/focus reveal, feedback "Tersalin"); pesan punya exit animation; user bubble putih; typing dots saat `status === "submitted"`; error bar + `regenerate()`.

### 7.5 `lib/validation.ts` — inventaris schema zod
`signInSchema`, `signUpSchema`, `onboardingSchema` (schoolOrigin/gradeLevel 10-12/interests 1-5), `assessmentAnswerSchema` (questionId uuid, score 1-5), `assessmentSkipSchema` (questionId), `gradeSchema` (subject 1-50, semester 1-5, score 0-100), `gradeDeleteSchema`, `profileSchema` (fullName + sekolah + kelas + interests).

---

## 8. Inventaris server actions (semua di `lib/actions/`)

| Action | File | Input | Efek & return |
|--------|------|-------|---------------|
| `registerAction` | auth | FormData | insert user + signIn → redirect `/onboarding`; `{error}` bila gagal |
| `loginAction` | auth | FormData | signIn → redirect `/dashboard`; `{error}` |
| `logoutAction` | auth | — | signOut → redirect `/` |
| `saveOnboardingAction` | onboarding | FormData | update sekolah/kelas/minat → **redirect `/onboarding`** (resume: halaman melihat data & pindah ke tur) |
| `completeOnboardingAction` | onboarding | — | set `onboarding_completed_at` → redirect `/dashboard` |
| `saveAnswerAction` | assessment | `{questionId, score 1-5}` | upsert jawaban (onConflictDoUpdate) → `{ok}` |
| `skipQuestionAction` | assessment | `{questionId}` | insert score 0 dengan `onConflictDoNothing` → `{ok, skipped}` |
| `completeAssessmentAction` | assessment | — | validasi jumlah jawaban ≥ jumlah soal → set flag → redirect `/dashboard`; `{ok:false,error}` bila kurang |
| `restartAssessmentAction` | assessment | — | hapus semua jawaban + reset flag → redirect `/assessment` |
| `saveGradeAction` | grades | `{subject, semester, score}` | upsert nilai → `{ok}` |
| `deleteGradeAction` | grades | `{subject, semester}` | hapus baris → `{ok}` |
| `completeGradesAction` | grades | — | validasi tiap semester wajib ≥7 mapel (default kelas ∪ semester terisi) → set flag → redirect `/dashboard`; `{ok:false,error}` berisi shortfall bila kurang |
| `updateProfileAction` | profile | FormData | update nama/sekolah/kelas/minat → `{ok}` (indikator "Tersimpan") |
| `restartTourAction` | profile | — | reset `onboarding_completed_at` → redirect `/onboarding` |
| `resetChatAction` | chat | — | hapus semua `chat_sessions` user (cascade ke `chat_messages`) → `{ok}` / `{ok:false,error}` |
| `deleteAccountAction` | account | FormData (password, confirmation) | verifikasi password (bcrypt) + konfirmasi `HAPUS` → delete user (cascade semua data) → signOut `/`; `{error}` bila gagal |
| `createQrisTransactionAction` | payment | — | housekeeping expiry → pakai ulang PENDING aktif bila ada, atau insert transaksi PENDING baru (ref + payload QRIS + `expires_at` 15 menit) → `{ok, transaction}` / `{ok:false,error}` |
| `confirmPaymentAction` | payment | `transactionId` uuid | owner check; PENDING & belum expiry → `PAID` + `paid_at`; sudah PAID → idempoten `{ok}`; expired → tandai `EXPIRED` + error ramah (lihat §9.3) |
| `runAnalysisAction` | analysis | — | cek kredit sesi (transaksi PAID & `used_at` kosong; tidak ada → `{ok:false, code:"PAYMENT_REQUIRED"}`) → skoring deterministik (bobot 30/25/20/15/10) → narasi AI → persist transaksional + konsumsi kredit (`used_at`, hanya saat sukses) → `{ok}` / `{ok:false,error}` (lihat §9.1) |

Konvensi: semua diawali `"use server"`, guard `auth()` + `redirect("/login")`, validasi zod, error ramah berbahasa Indonesia.

---

## 9. Integrasi AI

### 9.1 Analisis (Fase 3) — `lib/actions/analysis.ts` + `lib/analysis/*`
Alur (skor dihitung kode, LLM hanya menarasikan):
1. Guard: session → profile → ketiga flag completed → **kredit sesi** (`transactions` PAID & `used_at = null`; tidak ada → return `code: "PAYMENT_REQUIRED"` tanpa memanggil AI) → `GROQ_API_KEY` ada → `prepareAnalysisData` → bank jurusan ≥ 3.
2. `prepareAnalysisData(userId)` menghasilkan: profil, agregat asesmen (rata-rata per kategori, `dimensionScores` 0-100 per tag dimensi, top 4 & low 3 jawaban dengan teks soal), nilai (rata-rata per mapel + jumlah semester), daftar jurusan + `profile` (bobot skoring), dan `campusesByMajor: Map<majorId, CampusInfo[]>`.
3. `scoreMajors` (`lib/analysis/score.ts`) menghitung skor semua jurusan dengan bobot tetap: Minat 30% (fit RIASEC), Bakat 25% (fit aptitude), Nilai rapor 20% (mapel pendukung), Kepribadian 15%, Gaya belajar 10%. Sub-skor faktor 0-100, dinormalisasi terhadap dimensi/mapel yang ada datanya; total = rata-rata berbobot faktor tersedia (minimal 2 faktor); `match = clamp(40..97, 40 + 0.57 x total)`; ambil top 5 (kalau jurusan layak-skor < 3 → error ramah).
4. `generateText` (narasi saja; skema tidak lagi memuat match%/urutan):
```ts
const result = await generateText({
  model: groq("openai/gpt-oss-120b"),
  output: Output.object({ schema: buildAnalysisSchema(top5Ids) }),  // enum = id top 5 hasil skoring
  system: buildSystemPrompt(),            // Tera narator: skor final, reason wajib sebut sub-skor
  prompt: buildUserPrompt(data, ranked),  // data + HASIL SKORING SISTEM per jurusan
  temperature: 0.6,
  providerOptions: { groq: { reasoningEffort: "medium" } },
});
```
5. Merge: urutan & match dari kode; `reason` dari LLM (fallback narasi deterministik kalau LLM melewatkan jurusan); `personalityType` di-slice 50 (batas varchar); strengths trim/filter/slice 5.
6. Persist transaksional: `delete analysis_recommendations` → upsert `analysis_results` (onConflict user_id; `details = { strengths, alignmentNote, weights, method: "deterministic-v1" }`) → insert rekomendasi (match `toFixed(2)`, `factors` = rincian sub-skor jsonb).
7. Error handling: try/catch → pesan ramah; `GROQ_API_KEY` kosong → pesan instruksi.

**Prompt (analisis):** system = persona Tera + konteks "skor sudah dihitung sistem dengan bobot tetap, jangan diubah" + aturan narasi (reason menyebut sub-skor; validasi silang minat awal vs asesmen; tanpa emoji & em dash; personalityType RIASEC ≤50 char). User = teks terstruktur: PROFIL DASAR, ASESMEN (kategori + `dimensionScores` + top/low items), NILAI RAPOR, HASIL SKORING SISTEM (rank + sub-skor per jurusan top 5).

### 9.2 Chat (Fase 4) — `app/api/chat/route.ts` + `lib/chat/*`
Alur POST:
1. `auth()` → 401; **gate akses** `getChatAccess(userId)` (transaksi PAID terakhir < 5 hari; tidak aktif → 403) ; parse `{ messages: UIMessage[] }`; ambil pesan user terakhir → teks (cap 2000 char).
2. Cari/buat `chat_sessions` (satu per user) → insert pesan USER ke `chat_messages`.
3. Ambil 60 pesan terakhir (desc lalu di-sort asc) → map `rowToUIMessage` → history.
4. `getUserChatContext(userId, userText)`: prepare + hasil analisis + rekomendasi + katalog kampus (satu kampus per baris, dibatasi `CATALOG_CAMPUSES_PER_MAJOR` = 4 kampus unggulan per jurusan) + **injeksi on-demand** kampus yang disebut user (`findMentionedUniversities`, match nama penuh atau nama pendek, cap 3 kampus, lengkap kota/tipe/jurusan terkait). Catatan anggaran token: Groq free tier `openai/gpt-oss-120b` hanya 8.000 TPM, jadi konteks chat dijaga ramping (`HISTORY_LIMIT` = 16 pesan) dan direktori 200 kampus tidak di-embed penuh. Hasil → `buildChatSystemPrompt` (5 blok: PERAN DAN CAKUPAN dengan daftar out-of-scope + formula penolakan, CARA MENANGGAPI CURHAT termasuk batas krisis, PEGANGAN SAAT USER BERCERITA, SUMBER DATA dengan aturan salin angka persis + bagian KAMPUS YANG DISEBUT USER, GAYA BAHASA tanpa emoji/karakter non-standar).
5. `streamText({ model: groq("openai/gpt-oss-120b"), system, messages: await convertToModelMessages(history), temperature: 0.7, providerOptions: { groq: { reasoningEffort: "high" } } })`.
6. `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream, originalMessages: history, onFinish: persist pesan AI }) })`.
- `export const maxDuration = 60`.
- Balasan AI disanitasi `sanitizeChatText` (em dash, en dash, non-breaking hyphen/space → ASCII) di `onFinish` (persist) dan di `ChatPanel` (render).
- Client: `useChat` + `DefaultChatTransport` (default body = seluruh messages; server hanya memakai yang terakhir + rebuild history dari DB — sumber kebenaran riwayat adalah DB).

**Batasan Groq yang penting:** Structured Outputs (strict) **tidak mendukung streaming** → analisis non-streaming dengan progress UI; chat teks biasa streaming normal.

### 9.3 Pembayaran QRIS mockup (Fase 3, gerbang analisis & chat) — `lib/payment/*` + `lib/actions/payment.ts`
- Konstanta (`lib/payment/index.ts`): `PRICE_IDR = 15_000`, `QR_TTL_MINUTES = 15`, `CHAT_ACCESS_DAYS = 5`; helper murni `formatRupiah`, `formatCountdown`, `formatDateTimeId/formatDateId`, `makeReference` (`TRX-` + 8 char alphabet tanpa ambigu via WebCrypto), `buildQrisPayload` (string EMV-style mock deterministik dari ref).
- QR placeholder (`lib/payment/qr-placeholder.ts` + `components/payment/QrisPlaceholder.tsx`): matriks 29×29 deterministik (seed FNV-1a dari payload + xorshift32; finder 7×7 di 3 sudut + timing row/col 6 + alignment 5×5) dirender sebagai satu `<path>` SVG `crispEdges` — identik di server & client (aman hydration), murni dekoratif (tidak scannable).
- Siklus hidup: `createQrisTransactionAction` (housekeeping `EXPIRED` → reuse PENDING aktif → insert baru dengan `expires_at` sekarang + 15 menit) → pengguna menekan "Saya sudah bayar" di `QrisPaymentFlow` (jeda verifikasi ±1,2 dtk) → `confirmPaymentAction` (owner check, PENDING, belum expiry → `PAID` + `paid_at`; expired → `EXPIRED` + error "Buat kode baru") → komponen memanggil `onPaid` → `runAnalysisAction` otomatis.
- Konsumsi kredit: `runAnalysisAction` menuntut satu transaksi `PAID` dengan `used_at IS NULL`; konsumsi (`used_at = generatedAt`) dilakukan **di dalam transaksi DB yang sama dengan persist hasil** (`UPDATE ... WHERE id = ? AND status = 'PAID' AND used_at IS NULL RETURNING`, 0 baris → throw → rollback + `PAYMENT_REQUIRED`). Gagal di tengah (Groq error, dll) sebelum persist → kredit utuh, aman di-retry tanpa bayar ulang.
- Akses chat: `getChatAccess(userId)` = `paid_at` transaksi PAID terakhir + 5 hari (tanpa transaksi → tidak aktif). Dipakai AppShell (ChatMenuCard `unlocked`/`expired`, ChatFab), guard `/chat` (tampilan terkunci, bukan redirect), dan `POST /api/chat` (403). Hasil analisis lama dari sebelum fitur tetap ada, tapi akses chat tetap mengikuti aturan 5 hari ini.
- Housekeeping lazily: `expireStaleTransactions(userId)` dipanggil di awal `/analisis` dan `/akun` (PENDING lewat `expires_at` → `EXPIRED`).
- Riwayat/struk: `/akun` (`components/account/TransactionHistory.tsx`) memuat 20 transaksi terbaru (`listTransactionViews`); expand struk putih print-safe + tombol cetak (`window.print()`), print CSS `body:has(.receipt-print)` menyembunyikan seluruh body kecuali struk yang terbuka.

---

## 10. Konvensi & gotcha teknis (ringkas; detail di `continue.md` §4)

1. Halaman ber-session: `instant = false` + `await connection()` sebelum `auth()` (berlaku juga untuk guard redirect di `/`, `/login`, `/signup`).
2. Jangan render `<Link>` ke route ber-guard sebelum prasyarat selesai (prefetch-cache).
3. Lint react-hooks: dilarang setState sinkron di body effect; pakai interval/event handler/`useSyncExternalStore`.
4. Anti AI-slop di semua copy + prompt AI (grep audit tersedia). Output chat tambahan disanitasi `sanitizeChatText` di `onFinish` + saat render.
5. Groq: strict schema = semua field required; structured output tanpa streaming; `reasoningEffort` chat `high` (akurasi angka katalog), analisis `medium`.
6. `trustHost: true` wajib di auth.ts.
7. Upsert Drizzle butuh unique constraint; decimal = string dari driver. Kolom `timestamp` tanpa timezone: postgres.js/drizzle membaca naive sebagai UTC, jadi klien **wajib** memakai `connection: { TimeZone: "UTC" }` (`db/index.ts`) — tanpa itu `now()`/`defaultNow()` menulis wall-time lokal dan selisih jam (detail di `continue.md` §4.6).
8. Seeder idempotent (skip kalau terisi; `--force` untuk ulang).
9. Playwright di-install sementara saat verifikasi lalu di-uninstall.
10. Migrasi versioned: hasil `db:generate` wajib di-commit; file migrasi yang sudah teraplikasi jangan diedit (penanda hash); DB lama cukup di-baseline sekali.

---

## 11. Environment & scripts

**`.env.local`:** `DATABASE_URL` (postgres lokal `terangin`), `AUTH_SECRET`, `GROQ_API_KEY`.

**npm scripts:**
| Script | Fungsi |
|--------|--------|
| `dev` / `build` / `start` / `lint` | Next.js standar |
| `vercel-build` | `tsx scripts/migrate.ts && next build` (dipakai otomatis oleh Vercel) |
| `db:generate` | Buat migrasi baru dari perubahan schema (`drizzle-kit generate`) |
| `db:migrate` | Terapkan migrasi (`tsx scripts/migrate.ts`) |
| `db:baseline` | Tandai migrasi existing applied tanpa dijalankan (`tsx scripts/baseline.ts`) |
| `db:push` | Sync schema langsung, hanya untuk prototyping lokal |
| `db:studio` | Drizzle Studio |
| `db:seed` | 24 soal asesmen (`tsx db/seed.ts`, idempotent + `--force`) |
| `db:seed-colleges` | 12 jurusan + 200 kampus + 131 relasi (`tsx db/seed-colleges.ts`, sinkron non-destruktif; `--force` reset penuh) |

---

## 12. Verifikasi & testing

- **Statis:** `npm run lint` + `npm run build` (semua route harus ter-generate tanpa error).
- **E2E:** pola playwright-core + Chrome sistem; install sementara → jalankan skrip inline (`node --input-type=module -e "..."`) → uninstall. Detail langkah + akun test ada di `continue.md` §6–7.
- **Cek DB langsung:** `psql -d terangin -c "..."` untuk memverifikasi persist (jawaban, nilai, rekomendasi, chat).
- **Cek migrasi:** `npm run db:migrate` dua kali harus no-op di run kedua; riwayat ada di `select * from drizzle.__drizzle_migrations`.
- **Verifikasi AI:** butuh `GROQ_API_KEY` valid; chat diuji sampai jawaban menyebut angka dari katalog (daya tampung/UKT) dan merujuk hasil analisis.
