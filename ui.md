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

### Warna (token semantik, 2 tema)
Semua komponen memakai **token** yang nilainya berubah per tema (dark default di `:root`, light di class `.light`). Jangan tulis warna literal lagi; pakai utility token di bawah.
| Token utility | Dark | Light | Pemakaian |
|---------------|------|-------|-----------|
| `bg-bg` | `#050505` | `#f7f7f8` | Body & shell |
| `bg-surface` | `#161616` | `#ffffff` | Kartu konten, panel, field |
| `bg-surface-elevated` | `#1b1b1b` | `#ffffff` | Kartu aktif (stepper), chip user, input chat |
| `bg-sunken` | `#111111` | `#f4f4f5` | Sub-panel tersembunyi (kotak alignment, pre code, mock) |
| `bg-primary` + `text-primary-fg` | putih + hitam | hitam + putih | Tombol primary, bubble user, chip aktif, avatar |
| `bg-primary-hover` | `zinc-200` | `zinc-800` | Hover tombol primary |
| `bg-overlay/N` / `border-overlay/N` | putih N% | hitam N% | Semua fill/border translusen (pengganti `white/6`, dst.) |
| `text-fg` | putih | `#09090b` | Teks primer |
| `text-fg-soft` / `-secondary` / `-muted` / `-faint` / `-faintest` | zinc-200/300/400/500/600 | zinc-800/700/600/500/400 | Hierarki teks lewat opasitas |
| `text-success` / `bg-success/N` | emerald-400 | emerald-600 | Status Done |
| `text-warning` / `border-warning/N` | amber-300 | amber-700 | Timer ≤5 dtk, notice |
| `text-danger` / `border-danger/N` / `bg-danger/N` | red-400 | red-600 | Error & aksi destruktif |
| | | | |
| Aksen identitas (tetap) | `from-violet-500 to-fuchsia-500` | sama | Tile TeraMark di kartu chat sidebar |
| Aksen kekuatan (tetap) | `violet-400` | sama | Ikon sparkle di daftar kekuatan |
| Warna TeraMark | `--theme-teramark-bg: #ffffff` / `--theme-teramark-fg: #0a0a0a` | `#0a0a0a` / `#ffffff` (inverted) | Lingkaran & mata avatar Tera |
| Glow knob StepList | `shadow-[0_0_10px_var(--theme-knob-glow)]` | | Titik progress |
| Sweep StepList | `rgb(var(--theme-sweep) / a)` (sintaks slash, bukan `rgba(var(...), a)` yang invalid) | | Comet outline kartu aktif |

**Tema:** default dark, ikut `prefers-color-scheme` kalau user belum memilih; pilihan disimpan di localStorage (`terangin-theme`) dan diterapkan lewat class `.light` di `<html>` (script anti-FOUC di root layout). Switch tema ada di halaman `/akun`.

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
**Factor bar (analisis deterministik):** bar sub-skor faktor di `FactorBreakdown`. Container panel: `grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-3 sm:grid-cols-5`. Tiap faktor: label `text-[10px] text-zinc-500` + angka `text-[11px] tabular-nums text-zinc-300`, track `mt-1 h-0.5 overflow-hidden rounded-full bg-white/8`, isi `h-full rounded-full bg-white/50` dengan `width: %` (nilai 0-100, di-clamp).

### 3.6 Ikon (hanya dari `components/landing/icons.tsx`)
`ArrowRight`, `ArrowDown`, `ArrowUp`, `DownloadIcon`, `ChevronDown`, `SendIcon`, `SparkleIcon`, `TrashIcon`, `CheckIcon`, `CopyIcon` — semua stroke SVG 1.3–1.5, `currentColor`. **Jangan tambah ikon dekoratif/emoji.** Kalau butuh ikon baru, buat SVG stroke minimalis dengan pola yang sama.

---

## 4. TeraMark (avatar Tera)

Komponen: `components/landing/TeraMark.tsx` (client). Spesifikasi:
- SVG viewBox 240×240: **lingkaran penuh** (r=120) + **dua mata melengkung** (stroke 12, round cap), path `M70 100c9-19 27-19 36-1` (rotate -10) dan `M134 99c9-18 27-18 36 1` (rotate 10). Warna tidak hardcoded di SVG: lingkaran `fill: var(--theme-teramark-bg)` + mata `stroke: var(--theme-teramark-fg)` via rule `[data-teramark]` di `globals.css` — dark putih/gelap, light **inverted** gelap/putih.
- **Mata mengikuti cursor:** grup mata di-translate via spring (stiffness 180, damping 18) maksimum 16px dalam viewBox, dinormalisasi terhadap posisi cursor relatif ke elemen (range = max(3×lebar elemen, 240)).
- **Kedip:** keyframes `scaleY [1, 1, 0.12, 1, 1]` durasi 4s (`times [0, 0.9, 0.945, 0.97, 1]`), origin di `120px 100px`, `transformBox: view-box`, repeat infinity.
- **Reduced motion:** kalau `useReducedMotion()` true → mata statis tanpa tracking/blink.
- **Ukuran pemakaian:** `size-4` (header kecil), `size-5` (tile sidebar/kartu), `size-7` (avatar chat), `size-8` (header chat page), `size-10–14` (hero), `size-12` (intro/tur/analisis), `size-16` (empty chat).

---

## 5. App shell

### 5.1 Sidebar (desktop, `md:` ke atas)
- `w-72 shrink-0 border-r border-white/6 p-5`, fixed tinggi viewport dengan scroll internal.
- Urutan dari atas: logo `Terang.in` (TeraMark size-4 + wordmark, link `/dashboard`) → **StepList** (item Dashboard + menu 4 langkah, `mt-8`) → blok bawah (`mt-auto space-y-3 pt-10`): **ChatMenuCard** → **chip user** (Link ke `/akun`, `aria-label="Buka pengaturan akun"`, avatar inisial `size-9 rounded-full bg-primary text-primary-fg` + nama + "Siswa SMA" + ArrowRight `size-3.5 text-fg-faint`, hover `border-overlay/20`) → tombol **Keluar** (outline, full width).
- **StepList (menu navigasi):** item pertama **Dashboard** — `Link /dashboard` (span saat `demo`), kotak `size-9 rounded-lg` berisi `DashboardIcon` (aktif: `bg-primary text-primary-fg`; non-aktif: `bg-surface text-fg-muted`), sub-label progres dinamis ("Langkah N dari 4", atau dot hijau + "Semua langkah selesai"), selalu terbuka, sweep highlight saat rute `/dashboard`, **tidak ikut garis progress**. Di bawahnya 4 langkah: tiap item = Link (jika state done/active) dengan nomor kotak `size-9 rounded-lg` — aktif: `bg-white text-black` + kartu elevated `bg-[#1e1e1e] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]` (ring via shadow, bukan border, agar tinggi row tetap 60px dan posisi garis tetap presisi); non-aktif: `bg-[#161616] text-zinc-400` (opak, bukan `bg-white/6`, agar garis progress tidak tembus di belakang angka) + hover `bg-white/4`; terkunci: `opacity-60 cursor-not-allowed` tanpa link. Sub-label status: Done (dot hijau) / Not yet Completed. Highlight mengikuti rute (`usePathname`, `aria-current="page"`), fallback step journey aktif (di `/dashboard` keduanya ter-highlight: item Dashboard + langkah berikutnya).
- **Sweep outline step aktif (desktop + mobile):** overlay `absolute inset-0 overflow-hidden rounded-[inherit]` berisi `motion.span` persegi `aspect-square w-[220%]` di tengah dengan `conic-gradient` putih (arc comet: transparan lalu `white/85` memuncak di 75% arc, memudar di 90% arc) yang berotasi `360deg` linear 4.5s (desktop, arc 66deg) / 5.5s (mobile, arc 22deg, puncak `white/70`), ditutup `inset-px rounded-[11px] bg-[#1e1e1e]` (mobile `inset-[2px] rounded-[7px] bg-[#050505]`) sehingga tampak cahaya 1–2px mengelilingi kartu/chip. Fade masuk 0.35s; `pointer-events-none` + `aria-hidden`. Arc sempit di mobile agar tetap terbaca sebagai comet, bukan blok.
- **Progress line vertikal (dinamis, hanya membentang antar langkah 1–4):** track `absolute left-8 top-[30px] bottom-[30px] w-px` (persis center ikon step 1–4; dibatasi dalam wrapper langkah sehingga item Dashboard tidak tersambung) + base `bg-white/8`; fill `motion.span` `w-px bg-gradient-to-b from-white/12 via-white/35 to-white/70` dengan `height` dianimasikan ke posisi step aktif (0.55s ease `[0.21,0.47,0.32,0.98]`). Knob titik `size-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]` dirender di depan baris (layer `z-10`, `pointer-events-none`) di tepi atas kartu step aktif (posisi px dihitung dari tinggi track terukur via `ResizeObserver`), ikut beranimasi 0.55s; disembunyikan saat semua step done. Semua step selesai → fill 100%. Entrance: fill dari 0%, knob fade + scale 0.5.
- **ChatMenuCard:** `flex items-center gap-3 rounded-xl border p-3.5` + tile `size-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500` berisi TeraMark `size-5` + judul "Chat sama Tera" + subteks ("Kenapa aku cocok di Psikologi?" / "Lagi ngobrol" saat aktif / "Terbuka setelah analisis selesai" saat terkunci redup).

### 5.2 Mobile (di bawah `md`)
- Header: baris atas (logo + link "Akun" + tombol Keluar kecil) + **StepList versi kompak** (baris horizontal): chip pertama **Dashboard** (`DashboardIcon`, tanpa angka & dot, `Link /dashboard`, sweep saat aktif, tanpa connector ke langkah 1 — diganti spacer kosong `min-w-2 flex-1`), lalu nomor `size-6 rounded-md`, dot hijau untuk done, item clickable sama aturannya. Chip aktif dibungkus wrapper `relative grid place-items-center rounded-[9px] p-[2px]` dengan sweep outline yang sama (versi redup). Connector `h-px min-w-2 flex-1 bg-white/8 overflow-hidden` dengan fill `motion.span` gradient `from-white/10 to-white/45` yang terisi (width 0→100%, 0.45s ease sama) untuk segmen sebelum step aktif.
- **ChatFab:** tombol bulat `fixed bottom-5 right-5 z-40 md:hidden`, `size-14 rounded-full border border-white/12 bg-[#161616]/90 backdrop-blur` + TeraMark `size-9`, shadow `0_16px_40px_-12px rgba(0,0,0,0.9)`, masuk dengan spring (`initial {opacity:0, y:16, scale:0.9}`). Tampil hanya jika analisis selesai dan bukan di `/chat`.

---

## 6. Peta UI per halaman

### 6.1 Landing `/` (publik, 9 section berurutan)
1. **Navbar** sticky: logo "Terang.in" (`.in` zinc-500), menu Products (dropdown) + Pricing; kanan: AuthNav (login/guest state, dibungkus Suspense).
2. **Hero:** "Meet ⊙ Tera" (TeraMark inline di antara kata), tagline 2 baris, tombol "Try it Now ↓" (primary) + "Ask Us ↑" (secondary).
3. **ProductPreview** (`#preview`): mockup browser 2 kolom yang **mereplikasi UI app asli** — kiri: logo + `StepList` asli dengan prop `demo` (sweep outline, garis progress + knob, kotak opak) + kartu "Chat sama Tera" (state terkunci redup → aktif "Lagi ngobrol") + chip user (avatar putih inisial + "Siswa SMA"); kanan: `ChatDemo` scripted (header app dengan TeraMark size-8 + subteks + ikon reset visual, AI = avatar + teks tanpa bubble, user = bubble putih, input `rounded-2xl bg-[#161616]` + tombol ArrowUp, disclaimer). **Sequence animasi sekali saat masuk viewport** (tanpa AI call): step 3 aktif (t≈0,9 dtk) → advance ke step 4 (garis + knob + sweep beranimasi), chat unlock (t≈1,7 dtk) → typing dots → AI mengetik dengan caret → copy "Salin" muncul → bubble user → AI kedua streaming → settle (sweep step 4 terus berputar sebagai mikro-loop).
4. **Testimonial:** band `rounded-3xl bg-[#161616]` dengan judul "Ngobrol sama Tera kayak ngobrol sama Teman" + kutipan + lingkaran smiley putih besar (mata melengkung) bleed keluar kartu kanan atas.
5. **Features** (`#fitur`): judul "Terang.in Mudah Dipakai" + grid 2×2 kartu (Kenalan dulu, Jawab asesmen tanpa dihakimi, Lihat hasil analisismu, Ngobrol sama Tera) dengan mini-mockup yang **meniru UI app asli + animasi scripted sekali saat in-view** (semua di `components/landing/feature-mocks.tsx`, tanpa AI call): form onboarding (input + select Kelas + chip minat `INTEREST_OPTIONS` yang terpilih berurutan + counter "n/5 dipilih" + tombol Lanjut), quiz (chip "Minat", counter "7/24 terjawab" → "8/24", progress bar, timer badge countdown 15→5 dengan state amber ≤5 dtk, teks soal asli dari seed, 5 tombol Likert dengan satu opsi terpilih), hasil analisis dark-theme (badge rank + match% count-up 92/88 + bar + baris kampus/UKT + disclaimer), dan mini chat (bubble user + typing dots zinc + jawaban AI streaming dengan caret). Spinner "Asking Research..." dan dot warna-warni dihapus (melanggar aturan warna dekoratif).
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
  - CTA kontekstual: "Mulai X" (primary) / "Ubah nilai"/"Ulangi asesmen"/"Lihat hasil analisis" (outline) / terkunci: "Selesaikan X dulu" (span). Kartu "Hasil Analisis" saat belum selesai menampilkan hint mikro "Sesi analisis Rp 15.000 via QRIS (mode demo), dibayar di halaman analisis".
- Kartu Tera (chat): TeraMark + label "Tera" + status kanan ("Sebentar lagi" redup / dot hijau + "Siap" saat analisis selesai). CTA kontekstual: "Ngobrol sama Tera" (primary, Link ke `/chat`) saat analisis selesai; terkunci: span "Selesaikan analisis dulu".

### 6.5 Asesmen `/assessment`
- Header: "Asesmen Minat & Bakat" + subteks (24 soal, 15 detik, sisa waktu tersimpan).
- **Intro:** kartu dengan TeraMark size-12 + "Nggak ada jawaban benar atau salah" + 4 bullet + tombol "Mulai asesmen".
- **Kuis:** baris atas (chip kategori `bg-white/6` + counter "X/24 terjawab, Y terkunci") → progress bar → **grid 24 chip** (`grid-cols-8 sm:grid-cols-12 gap-1.5`; terjawab = putih, aktif = ring putih, belum dibuka = dashed disabled, terkunci = redup disabled) → kartu soal: "Soal N dari 24" + timer badge besar kanan (atau "Sudah dijawab") + teks soal + 5 tombol Likert (`sm:grid-cols-5 sm:min-h-16`, terpilih putih) + slot status/notice + nav bawah "Kembali" / "Lanjut"/"Selesai".
- **Finish:** TeraMark + judul status + tombol "Kerjakan sisa soal" atau "Cek lagi jawaban" + "Simpan & proses".
- **Completed view:** "Asesmen selesai" + jumlah jawaban + tanggal + tombol "Ulangi asesmen" (outline) + "Kembali ke dashboard" (primary). Export PDF tidak di sini, tapi satu tombol di `/analisis` (lihat §6.7).

### 6.6 Input Nilai `/nilai`
- Header + banner hijau (jika sudah selesai) + **chip semester** (Semester 1..n, aktif putih, "+ Semester" dashed, cap 5).
- Kartu semester: judul "Semester N" + counter kanan `text-[11px]` ("X dari 7 mapel" dengan `text-amber-300/80` saat kurang, jadi "X mapel tersimpan" `text-zinc-500` saat cukup) → baris mapel (label/input mapel + input nilai + tombol trash; sub-line status) → **baris saran** "Saran dari Semester 1" (mapel redup dashed + input nilai dashed + tombol "Lewati") → "Tambah cepat" chips → tombol dashed "Tambah mata pelajaran". **Aturan baris kosong:** maksimal satu baris kosong (draft belum persisted) per semester — chip "Tambah cepat" mengisi draft yang ada, dan tombol "Tambah mata pelajaran" saat draft sudah ada tidak menambah baris baru (tidak menumpuk).
- Footer: counter total + hint amber (`max-w-sm text-[12px] leading-relaxed text-amber-300/80`) "Tiap semester minimal 7 mata pelajaran. Semester n kurang m mapel." + tombol "Selesai" (primary; disabled dengan `disabled:opacity-40` sampai semua semester wajib, yaitu default kelas + semester yang sudah ada isinya, punya ≥7 mapel) / "Kembali ke dashboard".

### 6.7 Hasil Analisis `/analisis`
- **Intro:** kartu "Analisis siap dijalankan" + TeraMark + chip data (jawaban asesmen, mapel/semester, minat, "1 sesi analisis Rp 15.000") + tombol "Mulai analisis". Copy intro menyebut komposisi: "Skor kecocokan dihitung dari 5 faktor berbobot: minat, bakat, nilai rapor, kepribadian, dan gaya belajar."
- **Pembayaran sesi (QRIS mockup):** tanpa kredit tersisa, CTA jadi "Bayar Rp 15.000 & mulai analisis" dan membuka `QrisPaymentFlow` (kartu `rounded-2xl border-overlay/8 bg-surface px-7 py-10 sm:px-10 sm:py-12`): panel QR putih (`rounded-xl border-overlay/10 bg-white p-4`, tetap putih di kedua tema) berisi label "QRIS", `QrisPlaceholder` (pseudo-QR SVG 29×29 deterministik dari `qrisPayload` via seeded hash: 3 finder pattern + timing + alignment, `shapeRendering="crispEdges"`, aman dari hydration mismatch), "TERANG.IN" + NMID mock `tabular-nums`; kolom kanan: nominal `text-2xl font-semibold`, list Untuk/Metode (QRIS demo)/Referensi, countdown pill 15 menit `tabular-nums` (normal `border-overlay/10`, ≤60 dtk `border-warning/30 text-warning`, placeholder `--:--` sebelum mount), tombol "Saya sudah bayar" (primary) + "Batal" (outline, hanya menyembunyikan panel; transaksi tetap PENDING sampai kedaluwarsa), disclaimer mikro "Mode demo: pembayaran ini simulasi...". Fase: `preparing` (TeraMark pulsing + "Menyiapkan kode pembayaran") → `qr` → `verifying` (dot pulse + "Memverifikasi pembayaran", jeda ±1,2 dtk) → `paid` (CheckIcon success + "Pembayaran diterima", 0,7 dtk) → analisis dijalankan otomatis. Kedaluwarsa (countdown 0 atau ditolak server) → QR redup + label "Kode kedaluwarsa" + tombol "Buat kode baru". Refresh saat QR tampil → resume dari transaksi PENDING (dibuat ulang hanya jika sudah kedaluwarsa).
- **Running:** TeraMark pulsing + "Tera lagi menganalisis" + 4 tahap progress beranimasi.
- **Hasil:** baris tanggal "Dianalisis {tanggal}" + "Analisis ulang" (outline; tanpa kredit → memicu alur pembayaran QRIS di atas) + hint mikro "Analisis ulang butuh sesi baru Rp 15.000 via QRIS (mode demo). Satu pembayaran berlaku untuk satu kali proses analisis." → kartu kepribadian (TeraMark size-12 + label + tipe besar + alignment note dalam kotak `bg-black/20`) → kartu "Ringkasan potensimu" (paragraf) → kartu "Kekuatanmu" (list sparkle violet + grid 4 stat kategori dengan bar + chip mapel terkuat) → kartu "Rekomendasi jurusan" (5 sub-kartu: rank badge, nama, match% + bar, alasan, daftar kampus dengan daya tampung/UKT) + disclaimer → footer note.
- **Tombol unduh laporan:** saat hasil analisis ada, di bawah subteks header tampil satu tombol "Unduh laporan lengkap (PDF)" (primary + DownloadIcon, buka `/cetak/laporan` di tab baru) — satu-satunya tombol export di app; berisi asesmen + nilai + analisis (lihat §6.10).
- **Dasar penilaian:** chip bobot faktor (`rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-zinc-400`; Minat 30%, Bakat 25%, Nilai rapor 20%, Kepribadian 15%, Gaya belajar 10%; dibaca dari `saved.weights` dengan fallback `FACTOR_WEIGHTS`) + panel `FactorBreakdown` (spec bar di §3.5) di tiap kartu rekomendasi, hanya menampilkan faktor yang punya skor. Tampil hanya kalau data `factors` tersedia (hasil baru); hasil lama tanpa `factors` tidak menampilkan panel ini.

### 6.8 Chat `/chat`
- **Header sticky:** `sticky top-0 z-20 -mx-5 mb-5 flex items-center gap-3 border-b border-white/6 bg-[#050505]/85 px-5 py-3 backdrop-blur md:-mx-10 md:px-10` — TeraMark size-8 + "Tera" + subteks "Konselor jurusanmu, jawab pakai data profilmu"; kanan: kontrol **reset chat**.
- **Reset chat (inline dua langkah):** idle = ghost icon button `size-8 rounded-full text-zinc-500 hover:bg-white/5 hover:text-white` + TrashIcon (`aria-label="Hapus semua obrolan"`); klik → morph ke pill konfirmasi `border-red-400/25 bg-red-400/5` berisi "Hapus semua obrolan?" + tombol "Hapus" (`text-red-200 hover:bg-red-400/15`) + "Batal"; auto-dismiss 5 dtk; gagal → teks "Gagal. Coba lagi?" (hilang 3 dtk). Konfirmasi memanggil `resetChatAction` (hapus `chat_sessions`, cascade ke `chat_messages`), `stop()` dulu kalau sedang streaming, lalu `clearError()` + `setMessages([])`.
- **Akses berbasis pembayaran:** chat hanya terbuka saat hasil analisis ada dan pembayaran `PAID` terakhir masih dalam 5 hari (`CHAT_ACCESS_DAYS`). Akses kedaluwarsa → halaman menampilkan kartu terkunci (`rounded-2xl border-overlay/8 bg-surface`, TeraMark size-12 + "Akses chat kamu udah berakhir" + info tanggal berakhir + tombol "Buka halaman analisis"), `POST /api/chat` membalas 403, ChatMenuCard redup dengan subteks "Akses berakhir, analisis lagi", ChatFab tersembunyi.
- **Empty state:** TeraMark size-16 spring-in + bob halus (y ±4, 4 dtk) + "Halo, aku Tera" + subteks + 3 kartu saran pertanyaan (fade-in stagger 0.08s).
- **Percakapan:** user = bubble putih `rounded-2xl rounded-tr-md` rata kanan; AI = TeraMark size-7 + teks markdown (bold/list/blockquote/tabel rapi dengan overflow-x-auto, tanpa bubble); animasi fade/slide 0.22s (exit y -4 saat reset); typing dots saat menunggu token; **streaming caret** 2px berkedip di ujung blok terakhir (`chat-streaming`, CSS di globals.css, nonaktif saat reduced motion); error = bar merah + "Coba lagi".
- **Aksi salin:** di bawah pesan AI, `pl-10`, tombol h-7 pill "Salin" dengan CopyIcon → CheckIcon + "Tersalin" (reset 1.6 dtk); terlihat selalu di mobile, `md:opacity-0` lalu reveal saat hover/focus dalam (`group`); disembunyikan saat pesan itu sedang streaming.
- **Smart auto-scroll:** scroll listener pada scroll container terdekat (kolom `md:overflow-y-auto` di desktop, window di mobile; deteksi via `getScrollParent`) dengan threshold jarak 140px dari bawah — auto-scroll hanya saat user dekat bawah; kirim pesan sendiri selalu ke bawah; scroll target adalah `scrollHeight` container (bukan `scrollIntoView`, agar konten terakhir tidak tertutup sticky footer input); load awal & streaming pakai `behavior: "instant"`, idle `"smooth"`. **Tombol "ke pesan terbaru":** pill bulat `size-8` ChevronDown floating `absolute -top-11 left-1/2` di atas input, spring in/out, `aria-label="Ke pesan terbaru"`, tampil hanya saat `!atBottom`.
- **Input sticky bawah:** container `rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4 focus-within:border-white/25 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]` + textarea "Pesan Tera" (auto-grow, `transition-[height] duration-150`) + tombol bulat putih ArrowUp / kotak stop (`whileTap scale 0.92`) + disclaimer mikro "Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya." Background `bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent`.
- Header kecil: TeraMark size-8 + "Tera" + "Konselor jurusanmu, jawab pakai data profilmu".
- **Empty state:** TeraMark size-16 spring-in + "Halo, aku Tera" + subteks + 3 kartu saran pertanyaan (fade-in stagger 0.08s).
- **Percakapan:** user = bubble putih `rounded-2xl rounded-tr-md` rata kanan; AI = TeraMark size-7 + teks markdown (bold/list rapi, tanpa bubble); animasi fade/slide 0.22s; typing dots saat menunggu token; error = bar merah + "Coba lagi".
- **Teks AI disanitasi:** balasan assistant (streaming maupun dari riwayat DB) dinormalisasi `sanitizeChatText` sebelum render (em dash, en dash, non-breaking hyphen/space → ASCII) supaya konsisten dengan kebijakan anti-slop; tidak ada perubahan visual yang kasat mata.
- **Input sticky bawah:** container `rounded-2xl border border-white/10 bg-[#161616] p-2 pl-4` + textarea "Pesan Tera" + tombol bulat putih ArrowUp (atau kotak stop saat streaming) + disclaimer mikro "Tera bisa keliru. Cek info resmi kampus sebelum memutuskan ya." Background `bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent`.

### 6.9 Profil `/profil`
- Form kartu: Nama lengkap, Email (disabled), Asal sekolah, Kelas, Minat awal (chip maks 5) + tombol "Simpan" + indikator "Tersimpan".
- Kartu "Tur onboarding" + tombol "Ulangi tur" (outline).

### 6.10 Akun `/akun`
- Guard: auth + onboarding selesai; diakses lewat chip user sidebar atau link "Akun" di header mobile.
- Header: "Akun" + subteks "Pengaturan tampilan dan keamanan akunmu. Kamu masuk sebagai {email}."
- **Kartu "Tampilan"** (`rounded-2xl border-overlay/8 bg-surface p-6 sm:p-7`): deskripsi singkat + `ThemeSwitch` — segmented pill `flex w-fit items-center gap-1 rounded-full border border-overlay/10 bg-overlay/4 p-1` berisi tombol "Gelap" / "Terang" (`h-8 rounded-full px-4 text-[12px]`); opsi aktif memakai pill `bg-primary text-primary-fg` yang bergeser via `layoutId` (spring `stiffness 320 damping 30`; reduced motion → tanpa animasi). Perubahan langsung diterapkan + tersimpan di localStorage.
- **Kartu "Transaksi"** (`rounded-2xl border-overlay/8 bg-surface p-6 sm:p-7`, di antara Tampilan dan Zona bahaya): deskripsi + status akses chat ("Akses chat Tera aktif sampai {tanggal}" atau "Akses chat tidak aktif. Jalankan analisis ulang buat mengaktifkan lagi."). List maks 20 transaksi terbaru: baris `rounded-xl border-overlay/8 bg-sunken` dengan tombol full-width (ref `tabular-nums` + tanggal, nominal, badge status — Lunas `bg-success/10 text-success`, Menunggu pembayaran `border-warning/30 text-warning`, Kedaluwarsa `border-overlay/10 text-fg-faint` — dan ChevronDown yang berputar saat terbuka, `aria-expanded`). Klik baris → expand **struk** (AnimatePresence height auto + opacity, 0.22 dtk): dokumen selalu putih (`bg-white text-zinc-900 border-zinc-200`, print-safe di tema apa pun) berisi kop "Terang.in" + label "Struk pembayaran sesi analisis", ref + tanggal, grid Status/Metode (QRIS mockup demo)/Dibayar/Kredit sesi (dipakai tanggalnya / "Belum dipakai"), rincian "{description} (1 sesi)" + baris Total tebal, disclaimer mikro "Pembayaran simulasi (mockup)..." + tombol "Cetak / Simpan PDF" (zinc-900 solid, `print:hidden`, `window.print()`). **Print CSS** (`body:has(.receipt-print)`): saat mencetak, seluruh body disembunyikan kecuali `.receipt-print` yang diposisikan absolute full-width (tanpa border/radius); halaman `/cetak/laporan` tidak terpengaruh. Empty state: "Belum ada transaksi. Kode pembayaran dibuat otomatis saat kamu menjalankan analisis di halaman Hasil Analisis."
- **Kartu "Hapus akun"** (`rounded-2xl border-danger/20 bg-danger/5 p-6 sm:p-7`): judul + daftar eksplisit data yang terhapus permanen (profil, jawaban asesmen, nilai, analisis, chat, transaksi); tombol "Hapus akun" (outline `border-danger/30`, TrashIcon) → reveal form (fade/slide 0.22s): input **password** + input **ketik HAPUS**; tombol "Hapus akun permanen" (solid `bg-danger text-white`) aktif hanya saat password terisi dan konfirmasi persis `HAPUS`; error inline `text-danger` (password salah / konfirmasi salah). Sukses → seluruh data terhapus (cascade) + signOut → landing.
- Pembayaran: per sesi analisis via QRIS mockup (Rp 15.000, kredit 1 run, akses chat 5 hari). Subscription: **belum ada** (ditunda).

### 6.11 Dokumen cetak `/cetak/laporan` (laporan lengkap)
- Halaman standalone **tanpa AppShell**, tema **light profesional** (latar putih, teks zinc-900, aksen abu saja) untuk print/fotokopi dan lampiran sekolah; konten `max-w-[820px] mx-auto` di layar, `print:max-w-none print:px-0 print:py-0`.
- Guard: auth + onboarding + asesmen + nilai + analisis sudah ada (belum → redirect ke langkah kurang / `/analisis`); `metadata.robots` noindex; `metadata.title` "Laporan Lengkap: Terang.in".
- **Kop:** wordmark `Terang.in` (`.in` zinc-400) + label mikro "Dokumen pribadi" → judul `text-2xl font-semibold tracking-tight` "Laporan Lengkap: Asesmen, Nilai, dan Hasil Analisis" → deskripsi singkat; garis bawah `border-b-2 border-zinc-900`.
- **Data peserta:** grid 2 kolom — Nama, Sekolah, Kelas, Tanggal asesmen (`Intl.DateTimeFormat("id-ID", { dateStyle: "long" })`).
- **Bagian A. Hasil Asesmen:** kalimat jumlah terjawab (+ soal terlewat karena batas waktu); kartu `rounded-lg border-zinc-200 bg-zinc-50 p-4` "Tiga kekuatan teratas" (badge nomor `size-5 bg-zinc-900 text-white`, nama dimensi + kategori, skor `/100`); 4 kategori (Minat/RIASEC, Bakat, Kepribadian, Gaya belajar) dengan baris `grid-cols-[150px_1fr_52px]` — label, bar `h-1.5 bg-zinc-200` + fill `bg-zinc-800`, angka kanan.
- **Bagian B. Nilai Rapor:** kalimat jumlah mapel + semester; tabel `border-zinc-200` rounded — kolom Mata pelajaran, Rata-rata (`tabular-nums`), Semester (jumlah semester datanya), diurutkan dari rata-rata tertinggi; catatan mikro "rata-rata dihitung dari nilai yang kamu masukkan tiap semester".
- **Bagian C. Hasil Analisis:** baris "Dianalisis pada {tanggal}"; grid 2 kolom kartu "Tipe kepribadian" (`text-lg font-semibold`) + "Catatan keselarasan"; "Ringkasan potensimu" (paragraf); "Kekuatanmu" (list disc); "Rekomendasi jurusan" — sub-kartu per jurusan (rank badge, nama, `{match}% cocok`, bar match, alasan, daftar kampus dengan daya tampung + UKT format `Rp xjt per semester` yang sama dengan app) + disclaimer perkiraan; setiap sub-kartu `break-inside-avoid`.
- **Footer dokumen:** disclaimer skala 0-100 bukan nilai kelulusan, disclaimer "panduan awal, keputusan tetap milikmu", dan "Dibuat dengan Terang.in pada {tanggal}" (`text-zinc-400`).
- **Toolbar layar (client, `print:hidden`):** fixed kanan bawah — tombol "Kembali" (outline, ke `/analisis`) + "Cetak / Simpan PDF" (pill zinc-900 + DownloadIcon) memanggil `window.print()`; tidak auto-print saat load.
- **Print CSS** (globals.css): `@page { size: A4; margin: 16mm }`, body dipaksa putih, `:root { color-scheme: light }`; class `.print-exact` (`print-color-adjust: exact`) dipasang di root dokumen agar bar/background tercetak.
- Copy dokumen fixed, profesional, **tanpa emoji/em dash/panah teks**; skala dimensi 0-100, match pakai persen.

### 6.12 Deck pitch `/pitch` (standalone)
- Halaman deck 12 slide **16:9** (13,333in × 7,5in) untuk presentasi hackathon; **selalu gelap** (warna literal `#050505`/`#161616`/`#111111`, pengecualian token seperti §6.11 yang selalu terang), publik + `noindex`, tanpa AppShell.
- Tipografi besar ala editorial: judul slide 44-64px `tracking-tight`, sub 20px, bullet 19-21px, judul kartu 18px, deskripsi 15px, band catatan 16px, angka statistik 88px; hierarki lewat ukuran dan opasitas, tanpa glow/gradien dekoratif.
- Slide sparse (Mengapa Salah Jurusan, Dampak Sosial, Model Bisnis) memakai **baris besar bernomor** (`01/02/03` `tabular-nums` + hairline `border-white/8`) yang mengisi kanvas; slide fitur/tech/keunggulan memakai grid kartu penuh tinggi dengan konten center.
- **Screenshot asli app** di slide Tampilan Antarmuka (dashboard desktop + chat mobile) dan Demo Produk (hasil analisis), diimpor statis dari `app/pitch/*.png`, dibungkus frame minimal `rounded-xl border-white/10` + shadow tipis. Tidak ada mock ber-avatar.
- TeraMark hanya sebagai **mikrologo** di lockup cover dan footer slide (override `--theme-teramark-*` di `.pitch-slide` menjaga versi gelap di tema terang); cover memakai wordmark "TERANG.IN" raksasa opasitas 4% sebagai tekstur, bukan avatar.
- Print CSS: `@page pitch-deck { size: 13.333in 7.5in; margin: 0 }` (named page, halaman cetak lain tetap A4); `body:has(.pitch-slide)` memaksa bg gelap saat print; tiap `.pitch-slide` dipaksa 1280×720px + `break-after: page`.
- Toolbar layar `PitchToolbar` (`print:hidden`): "Kembali" ke `/` + "Cetak / Simpan PDF".
- Artefak: `pitch-terangin.pdf` di root repo (12 halaman, 960×540pt, via `page.pdf` 1280×720 px `printBackground`).
- Cover menampilkan "Tiga Trio Bertiga Ngawi East Timur"; bullet slide Tampilan Antarmuka berbunyi "Dashboard gelap minimalis yang fokus."

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
| Sequence demo landing | sekali saat in-view (IntersectionObserver `once`, margin -100px; ProductPreview), tanpa AI: step advance t≈0,9 dtk → chat start t≈1,7 dtk → typing dots (0,9 dtk) → streaming 2 karakter/24ms → pause → bubble user → dots → streaming kedua; settle dengan sweep terus berputar |
| Mock fitur landing | sequence sekali in-view (`useInView` once): chip minat terpilih 350/700/1050ms, timer quiz countdown 15→5 (tick 0,5 dtk, amber ≤5), match% count-up 26ms, reply chat streaming 2 karakter/24ms |
| Reduced motion landing demo | langsung tampil state akhir (advance step, chat penuh, bars/value final) tanpa sequence; caret & loop dimatikan |
| Avatar melayang (tur) | y `[0,-6,0]` duration 3.2 repeat |
| Typing dots | opacity `[0.3,1,0.3]` duration 1.2, delay bertingkat |
| Auto-scroll chat | hanya saat dekat bawah (scroll listener pada scroll container, threshold 140px); pesan sendiri selalu ke bawah; scroll ke `scrollHeight` container; `instant` saat load/streaming, `smooth` saat idle |
| Tombol ke pesan terbaru | spring `stiffness 300 damping 26` in/out; tampil saat sentinel bawah tidak terlihat |
| Streaming caret chat | `.chat-streaming > :last-child::after` 2px, blink 1.1s ease-in-out; statis saat reduced motion |
| Aksi salin pesan | reveal hover/focus (`md:opacity-0` lalu `group-hover/focus-within:opacity-100`), feedback "Tersalin" 1.6 dtk |
| Reset chat | morph idle↔konfirmasi AnimatePresence 0.18s; pesan exit y -4 0.22s; empty state spring masuk |
| Alur QRIS | preparing (TeraMark pulse) → qr (countdown 1 dtk tick, amber ≤60 dtk) → verifying (1,2 dtk) → paid (0,7 dtk) → auto-run analisis; reduced motion → tanpa jeda/pulse |
| Expand struk transaksi | height auto + opacity AnimatePresence 0.22s; ChevronDown rotate; reduced motion → instan |
| Switch tema /akun | pill aktif bergeser via `layoutId`, spring `stiffness 320 damping 30`; reduced motion → langsung; ganti tema pakai transisi warna body 200ms |
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
