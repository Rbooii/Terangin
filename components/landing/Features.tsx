import type { ReactNode } from "react";
import FadeIn from "./FadeIn";
import { SparkleIcon } from "./icons";

function FeatureCard({
  title,
  description,
  delay,
  children,
}: {
  title: string;
  description: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <FadeIn delay={delay} className="h-full">
      <div className="flex h-full flex-col rounded-2xl border border-white/6 bg-[#161616] p-6 sm:p-7">
        <h3 className="text-[15px] font-medium text-white">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
      </div>
    </FadeIn>
  );
}

function SignupMock() {
  const fields = ["Nama", "Sekolah", "Kelas", "Minat awal"];
  return (
    <div className="rounded-xl border border-white/8 bg-[#101010] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/6 px-3 py-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="truncate text-[10px] text-zinc-300">
            Isi data dasar biar Tera kenal kamu
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-zinc-500">Working</span>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        {fields.map((field) => (
          <div
            key={field}
            className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
          >
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">
              {field}
            </p>
            <div className="mt-2 h-1.5 w-3/4 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <span className="rounded-full bg-white px-3.5 py-1 text-[10px] font-medium text-black">
          Lanjut
        </span>
      </div>
    </div>
  );
}

const bars = [36, 52, 44, 68, 58, 82, 46, 62, 74, 100, 56, 70];
const tags = ["Minat", "Bakat", "Kepribadian", "Gaya Belajar"];

function AssessmentMock() {
  return (
    <div className="rounded-xl border border-white/8 bg-[#101010] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-white/6 px-2 py-1 text-[10px] text-zinc-300">
            Rekap
          </span>
          <span className="truncate text-[10px] text-zinc-500">
            Psikometrik, 56 jawaban
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
          +23%
        </span>
      </div>
      <div className="mt-4 flex h-24 items-end gap-1.5">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${i === 9 ? "bg-white" : "bg-white/12"}`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalysisMock() {
  return (
    <div className="rounded-xl bg-zinc-200 p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium text-zinc-500">
          Hasil Analisis
        </span>
        <span className="flex items-center gap-0.5 rounded-md bg-zinc-900 px-2 py-1 text-[9px] leading-none text-white">
          ···
        </span>
      </div>
      <div className="mt-2.5 rounded-lg bg-white p-3 text-[11px] leading-relaxed text-zinc-600 shadow-sm">
        Kecocokan tertinggimu:{" "}
        <span className="font-medium text-zinc-900">Psikologi (92%)</span>,
        disusul Sistem Informasi (88%). Dua-duanya nyambung sama kekuatan
        analisis dan empatimu.
      </div>
      <div className="mt-2 rounded-lg bg-white p-3 text-[11px] leading-relaxed text-zinc-600 shadow-sm">
        Catatan: nilai Matematika semester 5 belum masuk. Tambahkan biar
        rekomendasi makin akurat.
      </div>
      <div className="mt-3 flex items-center gap-1.5 px-1 text-[10px] text-zinc-500">
        <SparkleIcon className="size-3 text-violet-500" />
        Dashboard diperbarui untuk{" "}
        <span className="flex items-center gap-1 font-medium text-zinc-700">
          <span className="size-1.5 rounded-full bg-violet-500" />
          profilmu
        </span>
      </div>
    </div>
  );
}

function ChatMock() {
  const dots = ["bg-emerald-400", "bg-amber-300", "bg-violet-400", "bg-sky-400"];
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/8 bg-[#101010] px-4 py-10">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-3.5 py-2 text-[11px] text-zinc-300">
        <span className="size-3 animate-spin rounded-full border-[1.5px] border-white/25 border-t-amber-300" />
        Asking Research...
      </div>
      <div className="flex items-center gap-2">
        {dots.map((dot) => (
          <span key={dot} className={`size-2.5 rounded-full ${dot}`} />
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Terang.in Mudah Dipakai
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Dari daftar sampai punya rencana, semuanya dalam satu alur yang
            jelas. Isi profil, jawab asesmen, lihat hasilnya, ngobrol sama
            Tera, lalu pilih jurusanmu. Nggak perlu ribet, nggak perlu
            tebak-tebakan.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <FeatureCard
            title="Kenalan dulu"
            description="Daftar dengan data dasar: nama, sekolah, kelas, dan minat awalmu. Tur singkat nunjukin cara Terang.in nemenin kamu."
            delay={0}
          >
            <SignupMock />
          </FeatureCard>
          <FeatureCard
            title="Jawab asesmen, tanpa dihakimi"
            description="Kuis interaktif buat gali minat, bakat, kepribadian, dan gaya belajarmu. Nggak ada jawaban benar atau salah. Masukin juga nilai rapor dan prestasimu."
            delay={0.08}
          >
            <AssessmentMock />
          </FeatureCard>
          <FeatureCard
            title="Lihat hasil analisismu"
            description="Terang.in nyocokin apa yang kamu suka dengan apa yang kamu kuasai. Kalau datamu kurang lengkap, kamu diarahin saran buat nambahin. Hasilnya tampil sebagai dashboard yang gampang dibaca."
            delay={0.16}
          >
            <AnalysisMock />
          </FeatureCard>
          <FeatureCard
            title="Ngobrol sama Tera"
            description="Tanya bebas: “Kenapa aku cocok di Psikologi?”, “Berapa biaya kuliahnya?”, “Ada beasiswa nggak?” Tera jawab pakai profilmu dan data kampus terbaru."
            delay={0.24}
          >
            <ChatMock />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
