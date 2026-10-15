# ui.md — UI/UX Context Terang.in

> Design system & peta UI lengkap. Referensi visual utama: `UI_DESIGN_PNG/Landing Page.png`. Semua komponen di bawah sudah terimplementasi persis seperti spesifikasi ini — **ikuti class string yang tertulis** agar konsisten. Untuk konteks sesi/status baca `continue.md`; untuk struktur kode baca `architecture.md`.

---

## 1. Prinsip desain

1. **Dark, minimal, tenang.** Latar hampir hitam, konten bicara lewat tipografi putih dan kartu abu gelap. Tidak ada warna dekoratif selain aksen kecil (hijau status, violet untuk identitas Tera/gradien).
2. **Pill & rounded.** Tombol selalu pill (`rounded-full`), input/kartu `rounded-xl`/`rounded-2xl`. Sudut tajam tidak dipakai.
3. **Hierarki lewat opasitas, bukan warna.** Putih = primer/aktif; zinc-400 = sekunder; zinc-500/600 = tersier; white/6-12 = border; white/4-8 = fill.
4. **Motion halus, tidak pernah berisik.** Fade/slide pendek (200–350ms), spring untuk elemen playful (FAB, avatar). Selalu hormati `prefers-reduced-motion` (via `useReducedMotion`).
5. **Tanpa AI-slop.** Tidak ada emoji, em dash, panah teks, middot, ikon dekoratif berlebihan. Ikon hanya SVG stroke minimalis dari `components/landing/icons.tsx`.
6. **Bahasa Indonesia santai-profesional.** "kamu", bukan "Anda". Hindari klise motivasi.

---

## 2. Design tokens

### Warna
| Token | Nilai | Pemakaian |
|-------|-------|-----------|
| Background | `#050505` | Body & shell |
| Card | `#161616` | Kartu konten, panel |
| Card elevated | `#1b1b1b` / `#1e1e1e` | Kartu aktif (stepper), chip user, input chat |
| Border subtle | `border-white/6` | Garis pemisah, kartu |
| Border default | `border-white/8` | Kartu konten |
| Border strong | `border-white/10` / `white/12` | Input, tombol outline, chip |
| Border hover | `border-white/25` / `white/30` | Hover state |
| Teks primer | `text-white` / `text-zinc-200` | Judul, isi penting |
| Teks sekunder | `text-zinc-300` / `text-zinc-400` | Body, deskripsi |
| Teks tersier | `text-zinc-500` / `text-zinc-600` | Label, hint, placeholder |
| Sukses | `emerald-400/80` (dot), `emerald-300` (teks), `emerald-400/10` (bg badge) | Status Done |
| Peringatan | `amber-300` | Timer ≤5 dtk, notice |
| Error | `red-400` (teks), `red-400/20` (border) | Pesan error |
| Aksen identitas | `from-violet-500 to-fuchsia-500` | Tile TeraMark di kartu chat sidebar |
| Aksen kekuatan | `violet-400` | Ikon sparkle di daftar kekuatan |

### Tipografi (Inter via `next/font`, variable `--font-inter`)
| Peran | Class | Contoh pemakaian |
|-------|-------|------------------|
| Judul halaman | `text-2xl font-semibold tracking-tight` | H1 semua halaman app |
| Judul hero landing | `text-4xl sm:text-6xl font-semibold tracking-tight` | "Meet ⊙ Tera" |
| Judul section landing | `text-3xl sm:text-4xl font-medium tracking-tight` | "Terang.in Mudah Dipakai" |
| Judul kartu | `text-[15px] font-medium` | Nama fitur/kartu |
| Judul besar kartu | `text-xl sm:text-2xl font-medium tracking-tight` | Intro asesmen, hasil analisis |
| Body | `text-[13px] leading-relaxed` | Deskripsi, isi chat |
| Body kecil | `text-[12px]` / `text-[11px]` | Hint, status, label chip |
| Mikro | `text-[10px]` | Badge langkah |
| Angka tabular | `tabular-nums` | Timer, angka |

### Radius & ukuran
- Tombol: `h-9` (kecil), `h-10` (standar), `h-11` (form utama), semua `rounded-full`.
- Input: `h-10`/`h-11`, `rounded-xl`.
- Kartu: `rounded-2xl` (konten), `rounded-xl` (sub-kartu/baris).
- Chip: `h-9` atau `px-3 py-1.5`, `rounded-full`.
- Konten app: `max-w-3xl` di dalam shell; landing `max-w-5xl`.
- Breakpoint utama: **`md`** (768px) — batas sidebar desktop ↔ mobile.

### Layout shell
- Desktop: sidebar `w-72` fixed `md:h-dvh md:overflow-hidden`; kolom konten `md:overflow-y-auto`.
- Mobile: header atas (logo + Keluar + stepper kompak), konten scroll normal.
- Konten app: `mx-auto w-full max-w-3xl flex-1 px-5 py-8 md:px-10 md:py-12`.

---

## 3. Komponen dasar (class string persis)

### 3.1 Tombol
**Primary (pill putih):**
```
h-11 rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200
disabled:cursor-not-allowed disabled:opacity-60   (atau opacity-40 untuk gating)
```
**Secondary/outline:**
```
h-10 rounded-full border border-white/10 px-5 text-[13px] text-zinc-300 transition-colors hover:bg-white/5 hover:text-white
```
**Ghost kecil (navbar):**
```
h-9 rounded-full px-3.5 text-[13px] text-zinc-300 transition-colors hover:text-white
```
**Tombol full-width kartu (CTA dashboard):** primary atau outline + `flex h-10 w-full items-center justify-center`.
**Terkunci (non-link):** `<span>` `flex h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-white/10 text-[13px] text-zinc-500`.
**Tombol ikon bulat (kirim/stop):** `grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200 disabled:opacity-40`.
**Dashed (tambah item):** `h-10 w-full rounded-full border border-dashed border-white/15 text-[13px] text-zinc-400 hover:border-white/30 hover:text-white`.

### 3.2 Input & form
**Input/select standar:**
```
h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none
transition-colors placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.06]
[&>option]:bg-[#161616]   (khusus select)
disabled:cursor-not-allowed disabled:opacity-50  (email read-only di profil)
```
**Input kecil (nilai mapel):** `h-10 w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-right text-[13px]` + `type="number" inputMode="decimal" step={0.01}`.
**Input saran (ghost):** sama tapi `border-dashed border-white/10 bg-white/[0.02]`.
**Textarea chat:** `max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13px] text-white outline-none placeholder:text-zinc-600` (auto-grow via `scrollHeight`, cap 128px).
**Label field:** `text-[12px] font-medium text-zinc-400` (block, di atas input).
**Error text:** `text-[12px] text-red-400`.
**Indikator autosave:** `text-[11px] text-zinc-600` dengan teks "Menyimpan..." → "Tersimpan" (hilang setelah ~2,2 dtk); notice sementara `text-[11px] text-amber-300/80`.

### 3.3 Chip
**Chip toggle (minat, semester):**
```
# tidak aktif
rounded-full border border-white/12 px-3.5 py-1.5 text-[12px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white
# aktif/terpilih
rounded-full border border-white/70 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black
# disabled (maks tercapai)
cursor-not-allowed rounded-full border border-white/8 px-3.5 py-1.5 text-[12px] text-zinc-600
```
**Chip info (profil di dashboard/analisis):** `rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400`.

### 3.4 Kartu
**Kartu konten:** `rounded-2xl border border-white/8 bg-[#161616] p-6 sm:p-7`.
**Kartu dashboard (dengan badge):** sama + konten: badge langkah kiri, status kanan, `h2 mt-4`, deskripsi `mt-2`, CTA `mt-5`.
**Badge langkah:** `rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300` (teks "Langkah N").
**Badge status Done:** dot `size-1.5 rounded-full bg-emerald-400/80` + `text-[11px] text-zinc-400`.
**Sub-kartu (rekomendasi, baris):** `rounded-xl border border-white/8 bg-black/20 p-4`.

### 3.5 Progress & indikator
**Progress bar:** track `h-1 overflow-hidden rounded-full bg-white/8`, isi `h-full rounded-full bg-white transition-all duration-300` dengan `width: %`.
**Timer badge asesmen:** `flex items-baseline gap-1 rounded-xl border px-3 py-1.5` + angka `text-2xl font-semibold leading-none tabular-nums` + label `text-[11px] opacity-70`; normal `border-white/10 text-white`, ≤5 dtk `border-amber-300/30 text-amber-300`.
**Typing dots (chat):** 3 titik `size-1.5 rounded-full bg-zinc-500` berdenyut `opacity [0.3,1,0.3]` delay 0.18s berurutan.
**Progress tahap (analisis):** lingkaran `size-6 rounded-full` — done `bg-emerald-400/15 text-emerald-300` + CheckIcon, aktif `border border-white/30` + dot berdenyut, pending `border border-white/10`.

### 3.6 Ikon (hanya dari `components/landing/icons.tsx`)
`ArrowRight`, `ArrowDown`, `ArrowUp`, `ChevronDown`, `SendIcon`, `SparkleIcon`, `TrashIcon`, `CheckIcon` — semua stroke SVG 1.3–1.5, `currentColor`. **Jangan tambah ikon dekoratif/emoji.** Kalau butuh ikon baru, buat SVG stroke minimalis dengan pola yang sama.

---

## 4. TeraMark (avatar Tera)

Komponen: `components/landing/TeraMark.tsx` (client). Spesifikasi:
- SVG viewBox 240×240: **lingkaran putih penuh** (r=120) + **dua mata melengkung gelap** (`#0a0a0a`, stroke 12, round cap), path `M70 100c9-19 27-19 36-1` (rotate -10) dan `M134 99c9-18 27-18 36 1` (rotate 10).
- **Mata mengikuti cursor:** grup mata di-translate via spring (stiffness 180, damping 18) maksimum 16px dalam viewBox, dinormalisasi terhadap posisi cursor relatif ke elemen (range = max(3×lebar elemen, 240)).
- **Kedip:** keyframes `scaleY [1, 1, 0.12, 1, 1]` durasi 4s (`times [0, 0.9, 0.945, 0.97, 1]`), origin di `120px 100px`, `transformBox: view-box`, repeat infinity.
- **Reduced motion:** kalau `useReducedMotion()` true → mata statis tanpa tracking/blink.
- **Ukuran pemakaian:** `size-4` (header kecil), `size-5` (tile sidebar/kartu), `size-7` (avatar chat), `size-8` (header chat page), `size-10–14` (hero), `size-12` (intro/tur/analisis), `size-16` (empty chat).

---

## 5. App shell

### 5.1 Sidebar (desktop, `md:` ke atas)
- `w-72 shrink-0 border-r border-white/6 p-5`, fixed tinggi viewport dengan scroll internal.
- Urutan dari atas: logo `Terang.in` (TeraMark size-4 + wordmark, link `/dashboard`) → **StepList** (menu 4 langkah, `mt-8`) → blok bawah (`mt-auto space-y-3 pt-10`): **ChatMenuCard** → **chip user** (avatar inisial `size-9 rounded-full bg-white text-black` + nama + "Siswa SMA") → tombol **Keluar** (outline, full width).
- **StepList (menu navigasi):** tiap item = Link (jika state done/active) dengan nomor kotak `size-9 rounded-lg` — aktif: `bg-white text-black` + kartu elevated `bg-[#1e1e1e] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]` (ring via shadow, bukan border, agar tinggi row tetap 60px dan posisi garis tetap presisi); non-aktif: `bg-[#161616] text-zinc-400` (opak, bukan `bg-white/6`, agar garis progress tidak tembus di belakang angka) + hover `bg-white/4`; terkunci: `opacity-60 cursor-not-allowed` tanpa link. Sub-label status: Done (dot hijau) / Not yet Completed. Highlight mengikuti rute (`usePathname`, `aria-current="page"`), fallback step journey aktif.
- **Sweep outline step aktif (desktop + mobile):** overlay `absolute inset-0 overflow-hidden rounded-[inherit]` berisi `motion.span` persegi `aspect-square w-[220%]` di tengah dengan `conic-gradient` putih (arc comet: transparan lalu `white/85` memuncak di 75% arc, memudar di 90% arc) yang berotasi `360deg` linear 4.5s (desktop, arc 66deg) / 5.5s (mobile, arc 22deg, puncak `white/70`), ditutup `inset-px rounded-[11px] bg-[#1e1e1e]` (mobile `inset-[2px] rounded-[7px] bg-[#050505]`) sehingga tampak cahaya 1–2px mengelilingi kartu/chip. Fade masuk 0.35s; `pointer-events-none` + `aria-hidden`. Arc sempit di mobile agar tetap terbaca sebagai comet, bukan blok.
- **Progress line vertikal (dinamis):** track `absolute left-8 top-[30px] bottom-[30px] w-px` (persis center ikon step 1–4) + base `bg-white/8`; fill `motion.span` `w-px bg-gradient-to-b from-white/12 via-white/35 to-white/70` dengan `height` dianimasikan ke posisi step aktif (0.55s ease `[0.21,0.47,0.32,0.98]`). Knob titik `size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]` dirender di depan baris (layer `z-10`, `pointer-events-none`) di tepi atas kartu step aktif (posisi px dihitung dari tinggi track terukur via `ResizeObserver`), ikut beranimasi 0.55s; disembunyikan saat semua step done. Semua step selesai → fill 100%. Entrance: fill dari 0%, knob fade + scale 0.5.
- **ChatMenuCard:** `flex items-center gap-3 rounded-xl border p-3.5` + tile `size-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500` berisi TeraMark `size-5` + judul "Chat sama Tera" + subteks ("Kenapa aku cocok di Psikologi?" / "Lagi ngobrol" saat aktif / "Terbuka setelah analisis selesai" saat terkunci redup).

### 5.2 Mobile (di bawah `md`)
- Header: baris atas (logo + tombol Keluar kecil) + **StepList versi kompak** (baris horizontal): nomor `size-6 rounded-md`, dot hijau untuk done, item clickable sama aturannya. Chip aktif dibungkus wrapper `relative grid place-items-center rounded-[9px] p-[2px]` dengan sweep outline yang sama (versi redup). Connector `h-px min-w-2 flex-1 bg-white/8 overflow-hidden` dengan fill `motion.span` gradient `from-white/10 to-white/45` yang terisi (width 0→100%, 0.45s ease sama) untuk segmen sebelum step aktif.
- **ChatFab:** tombol bulat `fixed bottom-5 right-5 z-40 md:hidden`, `size-14 rounded-full border border-white/12 bg-[#161616]/90 backdrop-blur` + TeraMark `size-9`, shadow `0_16px_40px_-12px rgba(0,0,0,0.9)`, masuk dengan spring (`initial {opacity:0, y:16, scale:0.9}`). Tampil hanya jika analisis selesai dan bukan di `/chat`.

---

## 6. Peta UI per halaman

### 6.1 Landing `/` (publik, 9 section berurutan)
1. **Navbar** sticky: logo "Terang.in" (`.in` zinc-500), menu Products (dropdown) + Pricing; kanan: AuthNav (login/guest state, dibungkus Suspense).
2. **Hero:** "Meet ⊙ Tera" (TeraMark inline di antara kata), tagline 2 baris, tombol "Try it Now ↓" (primary) + "Ask Us ↑" (secondary).
3. **ProductPreview** (`#preview`): mockup browser 2 kolom — sidebar stepper (1 Onboarding Done, 2 Assessment Bakat Done, 3 Input Nilai aktif, 4 Hasil Analisis) + panel chat statis (bubble AI abu, bubble user putih, input "Pesan Tera" + tombol kirim).
4. **Testimonial:** band `rounded-3xl bg-[#161616]` dengan judul "Ngobrol sama Tera kayak ngobrol sama Teman" + kutipan + lingkaran smiley putih besar (mata melengkung) bleed keluar kartu kanan atas.
5. **Features** (`#fitur`): judul "Terang.in Mudah Dipakai" + grid 2×2 kartu (Kenalan dulu, Jawab asesmen tanpa dihakimi, Lihat hasil analisismu, Ngobrol sama Tera) masing-masing dengan mini-mockup (form skeleton, bar chart, kartu hasil, pill "Asking Research...").
6. **Pricing** (`#pricing`): kartu "Terang.in / Rp 15k /Sesi / Billed Per Session / Get Terang.in" + teks "Terang.in Hanya NgeCharge Kamu Sekali Per Konsultasi".
7. **Wordmark:** "TERANG.IN" raksasa full-width via SVG `textLength` + gradien putih→gelap.
8. **CookieBanner:** fixed kanan bawah, teks English (sesuai desain), tombol Cookies Settings / Reject All / Accept All Cookies (persist localStorage via `useSyncExternalStore`).

### 6.2 Auth
- **`/signup`:** TeraMark size-12 → wordmark → "Bikin akun baru" → subteks → 3 input (Nama lengkap, Email, Password min 8) → tombol "Daftar & mulai" → link "Masuk" → "Kembali ke beranda" (tanpa panah teks). Semua terpusat `max-w-sm`.
- **`/login`:** pola sama: "Selamat datang kembali", 2 input, tombol "Masuk".

### 6.3 Onboarding `/onboarding`
- **Sub-step form ("Kenalan dulu, yuk"):** Asal sekolah (input), Kelas (select 10/11/12), Minat awal (chip multi-select 10 opsi, maks 5, counter "n/5 dipilih"), tombol "Lanjut".
- **Sub-step tur ("Tur singkat"):** kartu `rounded-2xl bg-[#161616]` dengan TeraMark size-12 melayang (bob ±6px), judul + body per slide (4 slide), transisi slide x±32, dots progress `size-1.5`, tombol Kembali / Lanjut / "Mulai perjalananmu".

### 6.4 Dashboard `/dashboard`
- Sapaan "Halo, {firstName}" + subteks + chip profil (sekolah, kelas, minat).
- 4 kartu langkah berurutan (Asesmen, Input Nilai, Hasil Analisis, + teaser Tera):
  - Badge "Langkah N" + status kanan (dot hijau "Selesai" / "Belum dimulai").
  - CTA kontekstual: "Mulai X" (primary) / "Ubah nilai"/"Ulangi asesmen"/"Lihat hasil analisis" (outline) / terkunci: "Selesaikan X dulu" (span).
- Kartu Tera (teaser chat): TeraMark + label "Sebentar lagi" + input disabled "Pesan Tera".

### 6.5 Asesmen `/assessment`
- Header: "Asesmen Minat & Bakat" + subteks (24 soal, 15 detik, sisa waktu tersimpan).
- **Intro:** kartu dengan TeraMark size-12 + "Nggak ada jawaban benar atau salah" + 4 bullet + tombol "Mulai asesmen".
- **Kuis:** baris atas (chip kategori `bg-white/6` + counter "X/24 terjawab, Y terkunci") → progress bar → **grid 24 chip** (`grid-cols-8 sm:grid-cols-12 gap-1.5`; terjawab = putih, aktif = ring putih, belum dibuka = dashed disabled, terkunci = redup disabled) → kartu soal: "Soal N dari 24" + timer badge besar kanan (atau "Sudah dijawab") + teks soal + 5 tombol Likert (`sm:grid-cols-5 sm:min-h-16`, terpilih putih) + slot status/notice + nav bawah "Kembali" / "Lanjut"/"Selesai".
- **Finish:** TeraMark + judul status + tombol "Kerjakan sisa soal" atau "Cek lagi jawaban" + "Simpan & proses".
- **Completed view:** "Asesmen selesai" + jumlah jawaban + tanggal + "Ulangi asesmen" + "Kembali ke dashboard".

### 6.6 Input Nilai `/nilai`
- Header + banner hijau (jika sudah selesai) + **chip semester** (Semester 1..n, aktif putih, "+ Semester" dashed, cap 5).
- Kartu semester: judul "Semester N" + counter "X mapel tersimpan" → baris mapel (label/input mapel + input nilai + tombol trash; sub-line status) → **baris saran** "Saran dari Semester 1" (mapel redup dashed + input nilai dashed + tombol "Lewati") → "Tambah cepat" chips → tombol dashed "Tambah mata pelajaran".
- Footer: counter total + tombol "Selesai" (primary) / "Kembali ke dashboard".

### 6.7 Hasil Analisis `/analisis`
- **Intro:** kartu "Analisis siap dijalankan" + TeraMark + chip data (jawaban asesmen, mapel/semester, minat) + tombol "Mulai analisis".
- **Running:** TeraMark pulsing + "Tera lagi menganalisis" + 4 tahap progress beranimasi.
- **Hasil:** baris tanggal "Dianalisis {tanggal}" + "Analisis ulang" (outline) → kartu kepribadian (TeraMark size-12 + label + tipe besar + alignment note dalam kotak `bg-black/20`) → kartu "Ringkasan potensimu" (paragraf) → kartu "Kekuatanmu" (list sparkle violet + grid 4 stat kategori dengan bar + chip mapel terkuat) → kartu "Rekomendasi jurusan" (5 sub-kartu: rank badge, nama, match% + bar, alasan, daftar kampus dengan daya tampung/UKT) + disclaimer → footer note.

### 6.8 Chat `/chat`
- Header kecil: TeraMark size-8 + "Tera" + "Konselor jurusanmu, jawab pakai data profilmu".
- **Empty state:** TeraMark size-16 spring-in + "Halo, aku Tera" + subteks + 3 kartu saran pertanyaan (fade-in stagger 0.08s).
- **Percakapan:** user = bubble putih `rounded-2xl rounded-tr-md` rata kanan; AI = TeraMark size-7 + teks markdown (bold/list rapi, tanpa bubble); animasi fade/slide 0.22s; typing dots saat menunggu token; error = bar merah + "Coba lagi".
- **Input sticky bawah:** container `rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4` + textarea "Pesan Tera" + tombol bulat putih ArrowUp (atau kotak stop saat streaming) + disclaimer mikro "Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya." Background `bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent`.

### 6.9 Profil `/profil`
- Form kartu: Nama lengkap, Email (disabled), Asal sekolah, Kelas, Minat awal (chip maks 5) + tombol "Simpan" + indikator "Tersimpan".
- Kartu "Tur onboarding" + tombol "Ulangi tur" (outline).

---

## 7. Pola interaksi & animasi

| Elemen | Spec |
|--------|------|
| Fade-in on scroll (landing) | `FadeIn`: opacity 0→1, y 24→0, duration 0.6, ease `[0.21, 0.47, 0.32, 0.98]`, `viewport once margin -80px` |
| Transisi slide (soal/tur) | `AnimatePresence mode="wait"`, x ±32, duration 0.3–0.35 |
| Pesan chat masuk | opacity 0→1, y 8→0, duration 0.22 |
| FAB & empty-state avatar | spring `stiffness 260 damping 22` |
| Sweep outline StepList | conic-gradient putih berotasi 360deg, 4.5s linear (mobile 5.5s), fade masuk 0.35s; statis tanpa rotasi saat reduced motion |
| Progress line StepList | fill height + knob `top` (px dari track terukur) 0.55s ease `[0.21,0.47,0.32,0.98]`; entrance fill dari 0%, knob fade + scale 0.5; knob di depan baris (`z-10`) pada tepi atas kartu aktif |
| Segmen mobile StepList | fill width 0→100%, 0.45s ease `[0.21,0.47,0.32,0.98]` |
| Avatar melayang (tur) | y `[0,-6,0]` duration 3.2 repeat |
| Typing dots | opacity `[0.3,1,0.3]` duration 1.2, delay bertingkat |
| Auto-scroll chat | `scrollIntoView` smooth (idle) / auto (streaming) agar tetap menempel bawah |
| Autosave indicator | "Menyimpan..." → "Tersimpan" → hilang 2,2 dtk |
| Notice (waktu habis) | amber, hilang setelah 3 dtk |
| Reduced motion | `useReducedMotion` → tanpa fade/slide/blink; sweep StepList tampil statis tanpa rotasi, fill/knob langsung pindah tanpa transisi |

---

## 8. Copywriting & tone

- **Bahasa:** Indonesia santai ("kamu"), hangat, tidak menghakimi. Contoh frasa khas: "Nggak ada jawaban benar atau salah", "Jawab spontan sesuai dirimu", "Keputusan akhirnya tetap milikmu".
- **Judul pakai Title Case ringan**, body sentence case. Angka pakai format Indonesia (Rp 8,5jt, 15 dtk).
- **Dilarang:** emoji, em dash (—), en dash, panah teks (→ ←), middot (·), "AI slop" seperti "Mari kita…", klise motivasi berlebihan, tanda seru beruntun.
- **Disclaimer wajib ada:** hasil analisis ("panduan awal, keputusan tetap milikmu"), data kampus ("perkiraan, cek situs resmi"), chat ("Tera bisa keliru").
- **Placeholder & label** singkat: "Pesan Tera", "Nama mata pelajaran", "0-100", "cth. SMAN 1 Bandung".
- Audit otomatis (jalankan sebelum menutup task):
```bash
grep -rn -E "—|–|→|←|· " app components lib --include="*.tsx" --include="*.ts" | grep -v "Math\|=>" || echo "CLEAN slop"
```

---

## 9. Aturan responsif

- **`md` (768px)** adalah satu-satunya breakpoint struktural: sidebar ↔ mobile header.
- Grid: 1 kolom di mobile untuk form & kartu; 2 kolom (`sm:grid-cols-2`) untuk fitur landing; `sm:grid-cols-5` untuk opsi Likert; `grid-cols-8 sm:grid-cols-12` untuk grid soal; `grid-cols-2 sm:grid-cols-4` untuk stat kategori analisis.
- Kartu saran chat & rekomendasi full-width di mobile.
- Ukuran teks responsif hanya di judul besar: `text-2xl sm:text-4xl`, `text-xl sm:text-2xl`.
- Aksi utama (submit, selesai) selalu full-width di mobile (`w-full sm:w-auto` / `sm:w-56`).
- FAB hanya mobile; sidebar hanya desktop — tidak pernah keduanya tampil bersamaan.

---

## 10. Aksesibilitas

- `aria-current="page"` pada link menu aktif; `aria-disabled="true"` pada item terkunci.
- `aria-label` deskriptif: tombol kirim ("Kirim pesan"), stop ("Hentikan balasan"), hapus ("Hapus {mapel}"), chip soal ("Soal N (terkunci/terjawab/belum dibuka)").
- Semua input form punya `<label>` atau `aria-label`; input chat `aria-label="Pesan untuk Tera"`.
- Fokus terlihat via perubahan border (`focus:border-white/25`); jangan matikan outline tanpa pengganti.
- SVG dekoratif `aria-hidden="true"`.
