# architecture.md — Arsitektur & Struktur Project Terang.in

> Dokumen teknis lengkap: techstack, struktur file, fungsi kunci, data layer, integrasi AI, dan konvensi. Untuk status sesi & gotcha praktis baca `continue.md`; untuk design system baca `ui.md`; untuk spesifikasi produk baca `PRD.md`.

---

## 1. Ringkasan sistem

Terang.in adalah aplikasi **Next.js 16 (App Router)** full-stack satu repo: landing publik, alur produk 5 langkah ber-guard, dua endpoint AI (analisis terstruktur & chat streaming), dan PostgreSQL via Drizzle. Tidak ada layanan eksternal selain **Groq API** (LLM).

```
Browser
  │
  ├─► Landing "/" (PPR: shell static + AuthNav di-stream via Suspense)
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
| `/` | ◐ PPR | Shell statis; `AuthNav` (baca session) di balik `<Suspense>` dengan fallback `AuthButtons` |
| `/login`, `/signup` | ○ Static | Form client (`useActionState`) → server actions |
| `/onboarding` | ƒ Dynamic | `instant = false` + `connection()`; auth → profile → redirect `/dashboard` jika sudah selesai |
| `/dashboard` | ƒ Dynamic | + redirect `/onboarding` jika onboarding belum selesai |
| `/assessment` | ƒ Dynamic | + redirect `/onboarding`; jika sudah selesai tampilkan completed view |
| `/nilai` | ƒ Dynamic | + redirect `/assessment` |
| `/analisis` | ƒ Dynamic | + redirect `/nilai` |
| `/chat` | ƒ Dynamic | + redirect `/analisis` jika belum ada hasil analisis |
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
const client = globalForDb.postgresClient ?? postgres(process.env.DATABASE_URL!, { max: 10 });
export const db = drizzle(client, { schema });   // singleton via globalThis di non-production
```

### 5.2 Schema (`db/schema.ts`) — 12 tabel + 4 enum

**Enum:** `assessment_category` (MINAT, BAKAT, KEPRIBADIAN, GAYA_BELAJAR) · `university_type` (PTN, PTS, KEDINASAN, PTLN) · `sender_type` (USER, AI) · `action_plan_status` (DRAFT, FINALIZED).

| Tabel | Kolom | Tambahan dari PRD |
|-------|-------|-------------------|
| `users` | id uuid PK, full_name, email unique, password_hash, school_origin, grade_level, created_at | + `initial_interests text[]`, + `onboarding_completed_at`, + `assessment_completed_at`, + `grades_completed_at` |
| `questions` | id, category enum, question_text | + `order_index int` (urutan kuis deterministik) |
| `user_assessment_answers` | id, user_id FK cascade, question_id FK cascade, score int | + **unique(user_id, question_id)** untuk upsert; `score 0` = skip terkunci, `1-5` = jawaban |
| `academic_records` | id, user_id FK, subject varchar(50), semester int, score numeric(5,2) | + **unique(user_id, subject, semester)** untuk upsert |
| `majors` | id, name, description, career_prospects | — |
| `universities` | id, name, type enum, location | — |
| `university_majors` | id, university_id FK, major_id FK, capacity int, estimated_tuition numeric(15,2) | — |
| `analysis_results` | id, user_id FK **unique** (one-to-one), personality_type varchar(50), analysis_summary text, generated_at | + `details jsonb` (menyimpan `{ strengths: string[], alignmentNote: string }`) |
| `analysis_recommendations` | id, user_id FK, major_id FK, match_percentage numeric(5,2), rank_order int | + `reason text` |
| `chat_sessions` | id, user_id FK, started_at | — (satu sesi aktif per user) |
| `chat_messages` | id, session_id FK cascade, sender_type enum, content text, created_at | — |
| `action_plans` | id, user_id FK **unique**, final_univ_major_id FK university_majors, roadmap_json jsonb, confidence_score int, status enum | **Belum dipakai** (Fase 5) |

**Catatan pembacaan:** kolom `decimal` dikembalikan sebagai **string** oleh driver → selalu `Number(...)` saat menghitung/menampilkan.

### 5.3 Migration & seeder
- `db/migrations/` (`npm run db:generate`): SQL versioned + `meta/_journal.json` + snapshot, di-commit ke git. Riwayat penerapan disimpan Drizzle di tabel `drizzle.__drizzle_migrations` (hash sha256 file + timestamp journal).
- `scripts/migrate.ts` (`npm run db:migrate`): runner migrasi terprogram (`drizzle-orm/postgres-js/migrator`) yang dimuat juga oleh `vercel-build`. Guard: skip kalau `VERCEL_ENV` ada dan bukan `production` (override `FORCE_MIGRATE=1`). Aman diulang, migrasi teraplikasi di-skip.
- `scripts/baseline.ts` (`npm run db:baseline`): sekali pakai untuk DB yang sudah terisi schema — tandai migrasi existing sebagai applied tanpa menjalankannya (abort kalau riwayat migrasi sudah ada).
- `db/seed.ts` (`npm run db:seed`): 24 soal asesmen (6 per kategori, Likert, RIASEC/Flanagan-inspired), idempotent (skip kalau `questions` terisi; `--force` hapus+isi ulang dengan peringatan cascade).
- `db/seed-colleges.ts` (`npm run db:seed-colleges`): 12 jurusan, 10 kampus (UI/ITB/UGM/IPB/Unpad/ITS/UNAIR/Undip/BINUS/Telkom), 34 relasi `university_majors` (daya tampung + estimasi UKT). Relasi di-link by-name setelah insert (map nama→id). Idempotent + `--force`.
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
│   │   ├── icons.tsx           # 8 ikon SVG stroke (ArrowRight/Down/Up, ChevronDown, Send, Sparkle, Trash, Check)
│   │   ├── FadeIn.tsx          # Wrapper motion whileInView (landing)
│   │   ├── Navbar.tsx          # Navbar + dropdown Products + slot authSlot
│   │   ├── AuthNav.tsx         # Server: auth() → AuthButtons | chip user + Keluar; ada connection()
│   │   ├── Hero.tsx / ProductPreview.tsx / Testimonial.tsx / Features.tsx / Pricing.tsx / Wordmark.tsx
│   │   └── CookieBanner.tsx    # Consent localStorage via useSyncExternalStore
│   ├── app/
│   │   ├── AppShell.tsx        # Shell: sidebar (logo/StepList/ChatMenuCard/user/Keluar) + mobile header + ChatFab
│   │   ├── StepList.tsx        # Menu 4 langkah (client, usePathname, locked=non-link, 2 varian responsif)
│   │   ├── ChatMenuCard.tsx    # Kartu chat di sidebar (locked/unlocked/active)
│   │   └── ChatFab.tsx         # FAB mobile (spring, hidden di /chat & saat locked)
│   ├── auth/LoginForm.tsx · SignupForm.tsx      # Client useActionState; SignupForm export inputClass
│   ├── onboarding/BasicsForm.tsx                # Form sekolah/kelas/chip minat; export INTEREST_OPTIONS
│   ├── onboarding/TourSlides.tsx                # Tur 4 slide (AnimatePresence + dots)
│   ├── assessment/AssessmentFlow.tsx            # Mesin kuis lengkap (lihat §7.1)
│   ├── grades/GradeInput.tsx                    # Input nilai lengkap (lihat §7.2)
│   ├── analysis/AnalysisPanel.tsx               # Intro/progress/hasil analisis (lihat §7.3)
│   ├── chat/ChatPanel.tsx                       # UI chat (lihat §7.4)
│   └── profile/ProfileForm.tsx                  # Edit profil + chips minat
├── lib/
│   ├── validation.ts           # Semua schema zod (lihat §7.5)
│   ├── onboarding.ts           # getUserProfile, getJourneySteps, tipe JourneyStep
│   ├── actions/
│   │   ├── auth.ts             # registerAction, loginAction, logoutAction
│   │   ├── onboarding.ts       # saveOnboardingAction (redirect resume), completeOnboardingAction
│   │   ├── assessment.ts       # saveAnswerAction, skipQuestionAction, completeAssessmentAction, restartAssessmentAction
│   │   ├── grades.ts           # saveGradeAction, deleteGradeAction, completeGradesAction
│   │   ├── profile.ts          # updateProfileAction, restartTourAction
│   │   └── analysis.ts         # runAnalysisAction (pipeline AI + persist transaksional)
│   ├── analysis/
│   │   ├── prepare.ts          # prepareAnalysisData(userId): agregasi lengkap (lihat §9.1)
│   │   ├── prompt.ts           # buildSystemPrompt(), buildUserPrompt(data)
│   │   └── schema.ts           # buildAnalysisSchema(majorIds) → zod Output.object
│   └── chat/
│       ├── context.ts          # getUserChatContext(userId): string konteks personal + katalog kampus
│       ├── prompt.ts           # buildChatSystemPrompt(context)
│       └── messages.ts         # rowToUIMessage(row), extractMessageText(uiMessage)
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

### 7.3 `components/analysis/AnalysisPanel.tsx`
Props: `saved: SavedAnalysisView | null`, `stats: AnalysisStats`. State: `mode` (idle/running/error), `stage` (0–3, interval 2,2 dtk), `error`.
- `run()` → `runAnalysisAction()` → sukses → `router.refresh()` (server re-render; remount via `key={generatedAt}` → tampil hasil). Error → mode error + tombol "Coba lagi".
- Render hasil: kartu kepribadian + alignment note, ringkasan (split paragraf), kekuatan + 4 bar kategori + chip mapel, 5 rekomendasi (rank, match bar, alasan, daftar kampus dengan `formatTuition`), disclaimer.

### 7.4 `components/chat/ChatPanel.tsx`
- `useChat({ messages: initialMessages, transport: new DefaultChatTransport({ api: "/api/chat" }) })`.
- Auto-scroll: `endRef.scrollIntoView` di effect `[messages, status]` (smooth saat idle, auto saat streaming).
- `submit(text)` → `sendMessage({ text })`; Enter kirim, Shift+Enter newline; textarea auto-grow (cap 128px).
- Render: markdown AI via `ReactMarkdown` + `markdownComponents` (p/h/strong/ul/ol/li/a/code/pre di-map ke styling minimal); user bubble putih; typing dots saat `status === "submitted"`; error bar + `regenerate()`.

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
| `completeGradesAction` | grades | — | validasi ≥1 record → set flag → redirect `/dashboard` |
| `updateProfileAction` | profile | FormData | update nama/sekolah/kelas/minat → `{ok}` (indikator "Tersimpan") |
| `restartTourAction` | profile | — | reset `onboarding_completed_at` → redirect `/onboarding` |
| `runAnalysisAction` | analysis | — | pipeline AI + persist → `{ok}` / `{ok:false,error}` (lihat §9.1) |

Konvensi: semua diawali `"use server"`, guard `auth()` + `redirect("/login")`, validasi zod, error ramah berbahasa Indonesia.

---

## 9. Integrasi AI

### 9.1 Analisis (Fase 3) — `lib/actions/analysis.ts` + `lib/analysis/*`
Alur:
1. Guard: session → profile → ketiga flag completed → `GROQ_API_KEY` ada → `prepareAnalysisData` → bank jurusan ≥ 3.
2. `prepareAnalysisData(userId)` menghasilkan: profil, agregat asesmen (rata-rata per kategori, top 4 & low 3 jawaban dengan teks soal), nilai (rata-rata per mapel + jumlah semester), daftar jurusan, dan `campusesByMajor: Map<majorId, CampusInfo[]>`.
3. `generateText`:
```ts
const result = await generateText({
  model: groq("openai/gpt-oss-120b"),
  output: Output.object({ schema: buildAnalysisSchema(majorIds) }),  // enum majorId dari DB
  system: buildSystemPrompt(),      // 13 prinsip konselor
  prompt: buildUserPrompt(data),    // agregat + kandidat jurusan
  temperature: 0.6,
  providerOptions: { groq: { reasoningEffort: "medium" } },
});
```
4. Post-validasi: dedupe majorId → sort match desc → slice 5 → clamp 40–97 → rankOrder 1..n; `personalityType` di-slice 50 (batas varchar); strengths trim/filter/slice 5. Jika rekomendasi < 3 → error minta ulang.
5. Persist transaksional: `delete analysis_recommendations` → upsert `analysis_results` (onConflict user_id; simpan `details = { strengths, alignmentNote }`) → insert rekomendasi (match `toFixed(2)`).
6. Error handling: try/catch → pesan ramah; `GROQ_API_KEY` kosong → pesan instruksi.

**Prompt (analisis):** system = persona "Tera konselor" + prinsip (semua klaim merujuk data; validasi silang minat awal vs asesmen; match% bervariasi realistis; alasan 2–3 kalimat menyebut data; tanpa emoji; personalityType RIASEC ≤50 char). User = teks terstruktur: PROFIL DASAR, ASESMEN (kategori + top/low items), NILAI RAPOR, DAFTAR JURUSAN KANDIDAT (id + nama + deskripsi singkat).

### 9.2 Chat (Fase 4) — `app/api/chat/route.ts` + `lib/chat/*`
Alur POST:
1. `auth()` → 401; parse `{ messages: UIMessage[] }`; ambil pesan user terakhir → teks (cap 2000 char).
2. Cari/buat `chat_sessions` (satu per user) → insert pesan USER ke `chat_messages`.
3. Ambil 60 pesan terakhir (desc lalu di-sort asc) → map `rowToUIMessage` → history.
4. `getUserChatContext(userId)` (prepare + analysis + rekomendasi + katalog kampus terformat) → `buildChatSystemPrompt` (9 aturan: santai-hangat, tanpa emoji/em dash, wajib cek katalog sebelum bilang data tidak ada, tidak mengarang, arahkan topik, markdown secukupnya).
5. `streamText({ model: groq("openai/gpt-oss-120b"), system, messages: await convertToModelMessages(history), temperature: 0.7, providerOptions: { groq: { reasoningEffort: "medium" } } })`.
6. `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream, originalMessages: history, onFinish: persist pesan AI }) })`.
- `export const maxDuration = 60`.
- Client: `useChat` + `DefaultChatTransport` (default body = seluruh messages; server hanya memakai yang terakhir + rebuild history dari DB — sumber kebenaran riwayat adalah DB).

**Batasan Groq yang penting:** Structured Outputs (strict) **tidak mendukung streaming** → analisis non-streaming dengan progress UI; chat teks biasa streaming normal.

---

## 10. Konvensi & gotcha teknis (ringkas; detail di `continue.md` §4)

1. Halaman ber-session: `instant = false` + `await connection()` sebelum `auth()`.
2. Jangan render `<Link>` ke route ber-guard sebelum prasyarat selesai (prefetch-cache).
3. Lint react-hooks: dilarang setState sinkron di body effect; pakai interval/event handler/`useSyncExternalStore`.
4. Anti AI-slop di semua copy + prompt AI (grep audit tersedia).
5. Groq: strict schema = semua field required; structured output tanpa streaming; `reasoningEffort` low/medium/high.
6. `trustHost: true` wajib di auth.ts.
7. Upsert Drizzle butuh unique constraint; decimal = string dari driver.
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
| `db:seed-colleges` | 12 jurusan + 10 kampus + 34 relasi (`tsx db/seed-colleges.ts`) |

---

## 12. Verifikasi & testing

- **Statis:** `npm run lint` + `npm run build` (semua route harus ter-generate tanpa error).
- **E2E:** pola playwright-core + Chrome sistem; install sementara → jalankan skrip inline (`node --input-type=module -e "..."`) → uninstall. Detail langkah + akun test ada di `continue.md` §6–7.
- **Cek DB langsung:** `psql -d terangin -c "..."` untuk memverifikasi persist (jawaban, nilai, rekomendasi, chat).
- **Cek migrasi:** `npm run db:migrate` dua kali harus no-op di run kedua; riwayat ada di `select * from drizzle.__drizzle_migrations`.
- **Verifikasi AI:** butuh `GROQ_API_KEY` valid; chat diuji sampai jawaban menyebut angka dari katalog (daya tampung/UKT) dan merujuk hasil analisis.
