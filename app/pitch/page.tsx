import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { TeraMark } from "@/components/landing/TeraMark";
import { DashboardIcon } from "@/components/landing/icons";
import PitchToolbar from "@/components/pitch/PitchToolbar";
import dashboardShot from "./app-dashboard.png";
import analisisShot from "./app-analisis.png";
import chatShot from "./app-chat-mobile.png";

export const metadata: Metadata = {
  title: "Pitch: Terang.in",
  description:
    "Deck pitch Terang.in oleh Tiga Trio Bertiga Ngawi East Timur.",
  robots: { index: false, follow: false },
};

function Slide({ n, children }: { n: number; children: ReactNode }) {
  return (
    <section className="pitch-slide print-exact relative flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#050505] px-14 py-11">
      {children}
      <div className="mt-8 flex items-center justify-between border-t border-white/6 pt-4">
        <span className="flex items-center gap-2 text-[13px] text-zinc-500">
          <TeraMark className="size-4" />
          <span>
            Terang<span className="text-zinc-600">.in</span>
          </span>
        </span>
        <span className="text-[13px] tabular-nums text-zinc-600">{n} / 12</span>
      </div>
    </section>
  );
}

function Heading({
  title,
  sub,
  center = false,
  size = 46,
}: {
  title: string;
  sub?: string;
  center?: boolean;
  size?: number;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <h1
        className="font-semibold leading-[1.1] tracking-tight text-white"
        style={{ fontSize: size }}
      >
        {title}
      </h1>
      {sub && <p className="mt-3 text-[20px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function Bullet({ children, size = 21 }: { children: ReactNode; size?: number }) {
  return (
    <li
      className="flex items-start gap-3.5 leading-relaxed text-zinc-300"
      style={{ fontSize: size }}
    >
      <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-white/60" />
      <span>{children}</span>
    </li>
  );
}

function IndexRow({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-8 border-t border-white/8 py-7">
      <span className="pt-1.5 text-[15px] tabular-nums text-zinc-600">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="max-w-[920px] text-[23px] leading-relaxed text-zinc-200">
        {children}
      </p>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 border-t border-white/6 pt-5 text-center text-[16px] leading-relaxed text-zinc-400">
      {children}
    </div>
  );
}

function ScreenshotFrame({
  src,
  alt,
  className,
}: {
  src: typeof dashboardShot;
  alt: string;
  className: string;
}) {
  return (
    <div
      className={`${className} overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.9)]`}
    >
      <Image src={src} alt={alt} className="h-full w-full object-cover object-top" />
    </div>
  );
}

function ClipboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3.2h4M5.5 3.2A1.5 1.5 0 0 0 4 4.7v7.1a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 12 11.8V4.7a1.5 1.5 0 0 0-1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m6.2 9 1.4 1.4 2.6-3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PieIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 2.5V8h5.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.5 7.4c0 2.6-2.5 4.6-5.5 4.6-.6 0-1.2-.1-1.7-.2L3.5 13l.7-2.1C3 10 2.5 8.8 2.5 7.4c0-2.6 2.5-4.6 5.5-4.6s5.5 2 5.5 4.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 7.4h.01M8 7.4h.01M10.2 7.4h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 4.7 6.5 3l3 1.5L13.5 3v8.3L9.5 13l-3-1.5-4 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 3v8.5M9.5 4.5V13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DatabaseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChipIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect
        x="4.5"
        y="4.5"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M6.5 1.8v2.7M9.5 1.8v2.7M6.5 11.5v2.7M9.5 11.5v2.7M1.8 6.5h2.7M1.8 9.5h2.7M11.5 6.5h2.7M11.5 9.5h2.7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 2.2 13 4.2v3.3c0 3-2 5.1-5 6.3-3-1.2-5-3.3-5-6.3V4.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PHASES = [
  ["Onboarding & Profiling", "Pengumpulan data awal siswa"],
  ["Asesmen Minat & Bakat", "Pemetaan potensi diri"],
  ["Analisis & Personalization Engine", "Pemrosesan data berbasis AI"],
  ["Konsultasi AI Chatbot", "Diskusi interaktif dan eksplorasi"],
  ["Action Plan & Roadmap", "Penyusunan rencana aksi masa depan"],
  ["Diskusi dengan Orang Tua/BK", "Penyelarasan tujuan akhir"],
] as const;

const FEATURES: Array<[string, string, ReactNode]> = [
  ["Smart Assessment & Grade Mapper", "Kuis non-judgemental & input rapor.", <ClipboardIcon key="a" className="size-[18px]" />],
  ["Personalization Engine Dashboard", "Visualisasi kekuatan diri.", <PieIcon key="b" className="size-[18px]" />],
  ["Interactive AI Chatbot", "Konsultasi 24/7 dengan data real-time (biaya, daya tampung).", <ChatIcon key="c" className="size-[18px]" />],
  ["Action Plan System", "Menghasilkan roadmap hingga confidence score.", <MapIcon key="d" className="size-[18px]" />],
];

const STACK: Array<[string, string, ReactNode]> = [
  ["Frontend", "Next.js, Tailwind, Framer Motion", <DashboardIcon key="a" className="size-6" />],
  ["Backend", "PostgreSQL, Drizzle ORM", <DatabaseIcon key="b" className="size-6" />],
  ["AI", "Vercel AI SDK, Groq API", <ChipIcon key="c" className="size-6" />],
  ["Auth", "Auth.js", <ShieldIcon key="d" className="size-6" />],
];

const ADVANTAGES = [
  ["Pendekatan Holistik", "Psikometri + Rapor + Realita Ekonomi."],
  ["Pendampingan 24/7", "AI yang memahami konteks personal."],
  ["Berorientasi Aksi", "Bukan sekadar hasil tes, tapi roadmap masa depan."],
  ["Analisis Kompetitor", "Perbandingan dengan platform seperti Youthmanual dan RuangGuru."],
] as const;

export default function PitchPage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-10 print:max-w-none print:gap-0 print:px-0 print:py-0">
        <Slide n={1}>
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center gap-2.5 text-[15px] font-medium text-zinc-300">
              <TeraMark className="size-5" />
              <span>
                Terang<span className="text-zinc-500">.in</span>
              </span>
            </div>
            <h1 className="mt-12 max-w-[980px] text-[64px] font-semibold leading-[1.04] tracking-tight text-white">
              Terang.in: Temukan Jurusan, Raih Impianmu
            </h1>
            <p className="mt-7 text-[22px] text-zinc-400">
              Navigasi Cerdas untuk Pilihan Masa Depan
            </p>
            <div className="mt-auto border-t border-white/10 pt-6">
              <p className="text-[18px] font-medium text-zinc-200">
                Tiga Trio Bertiga Ngawi East Timur
              </p>
            </div>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 right-0 select-none text-[128px] font-semibold leading-none tracking-tight text-white/[0.04]"
            >
              TERANG.IN
            </span>
          </div>
        </Slide>

        <Slide n={2}>
          <Heading
            title="Krisis Identitas di Ambang Kelulusan"
            sub="Tantangan Kesiapan Karir Siswa SMA"
            center
          />
          <div className="mt-8 grid flex-1 grid-cols-3 gap-5">
            <div className="flex flex-col rounded-2xl border border-white/8 bg-[#161616] p-7">
              <p className="text-[17px] font-medium text-white">
                Siswa Bingung Arah Masa Depan
              </p>
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-[88px] font-semibold leading-none tabular-nums text-white">
                  92%
                </p>
                <p className="mt-5 text-[16px] text-zinc-400">siswa SMA</p>
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-white/8 bg-[#161616] p-7">
              <p className="text-[17px] font-medium text-white">
                Kesenjangan Pengenalan Diri
              </p>
              <div className="mt-6 flex flex-1 flex-col justify-center">
                <div className="flex gap-5">
                  <div className="flex flex-col justify-between text-[12px] tabular-nums text-zinc-600">
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>
                  <div className="flex h-[185px] flex-1 items-end justify-around gap-10 border-b border-white/10">
                    <div className="h-[72%] w-14 rounded-t-md bg-white/80" />
                    <div className="h-[64%] w-14 rounded-t-md bg-white/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-10 pl-10 pt-3 text-center text-[13px] leading-tight text-zinc-400">
                  <span>Tidak Tahu Minat</span>
                  <span>Tidak Tahu Bakat</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-white/8 bg-[#161616] p-7">
              <p className="text-[17px] font-medium text-white">
                Career Decision Self-Efficacy Rendah
              </p>
              <div className="flex flex-1 items-center justify-center">
                <div className="relative">
                  <svg viewBox="0 0 180 180" className="size-52 -rotate-90">
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="16"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="16"
                      strokeDasharray="219.9 219.9"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-[40px] font-semibold tabular-nums text-white">
                    50%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Note>
            Realitanya, mayoritas siswa kita lulus sekolah tanpa tahu arah.
            Mereka terjebak antara tekanan tren dan kurangnya pemahaman diri
            sendiri.
          </Note>
        </Slide>

        <Slide n={3}>
          <Heading title="Mengapa Siswa Salah Jurusan?" />
          <div className="flex flex-1 flex-col justify-center">
            <IndexRow index={0}>
              Kurangnya pengenalan potensi diri secara objektif.
            </IndexRow>
            <IndexRow index={1}>
              Kesenjangan informasi antara minat dan daya tampung/biaya kampus.
            </IndexRow>
            <IndexRow index={2}>
              Ketiadaan pemandu yang personal dan aksesibel.
            </IndexRow>
          </div>
          <Note>
            Masalah utamanya adalah rendahnya kesiapan dan minimnya pendampingan
            yang personal. Tanpa data yang valid, pengambilan keputusan menjadi
            spekulatif.
          </Note>
        </Slide>

        <Slide n={4}>
          <div className="flex flex-1 items-center gap-14">
            <div className="max-w-[680px]">
              <p className="text-[16px] font-medium text-zinc-400">
                Platform AI Terintegrasi
              </p>
              <h1 className="mt-3.5 text-[46px] font-semibold leading-[1.1] tracking-tight text-white">
                Solusi Terang.in: Navigasi Berbasis Data
              </h1>
              <ul className="mt-8 space-y-5">
                <Bullet>
                  Platform AI terintegrasi untuk analisis psikometri dan
                  akademik.
                </Bullet>
                <Bullet>
                  Fokus: Memberikan rencana aksi yang realistis bagi pengguna.
                </Bullet>
                <Bullet>
                  Pendekatan: Holistik (Psikologi + Data Akademik + Realita
                  Kampus).
                </Bullet>
              </ul>
            </div>
            <div className="ml-auto w-[380px] shrink-0">
              {["Psikologi", "Data Akademik", "Realita Kampus"].map(
                (word, index) => (
                  <div
                    key={word}
                    className={
                      index === 0
                        ? "pb-6"
                        : "border-t border-white/10 py-6"
                    }
                  >
                    <span className="block text-[13px] tabular-nums text-zinc-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-2 block text-[27px] font-medium tracking-tight text-zinc-200">
                      {word}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
          <Note>
            Terang.in hadir sebagai navigator cerdas yang mengintegrasikan
            psikometri dengan data nilai dan realita kampus untuk rekomendasi
            yang sangat personal.
          </Note>
        </Slide>

        <Slide n={5}>
          <Heading
            title="Alur Perjalanan Siswa di Terang.in"
            sub="Enam fase terstruktur menuju kepastian karier dan pendidikan"
            center
          />
          <div className="mt-8 grid flex-1 grid-cols-3 grid-rows-2 gap-5">
            {PHASES.map(([title, description], index) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-white/8 bg-[#161616] p-6"
              >
                <span className="grid size-10 place-items-center rounded-lg border border-white/10 text-[15px] tabular-nums text-zinc-300">
                  {index + 1}
                </span>
                <p className="mt-4 text-[18px] font-medium leading-snug text-white">
                  {title}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <Note>
            Proses ini dirancang untuk membimbing siswa dari bingung menjadi
            yakin melalui enam fase terstruktur yang saling terhubung.
          </Note>
        </Slide>

        <Slide n={6}>
          <Heading
            title="Fitur Utama untuk Keputusan yang Yakin"
            sub="Solusi komprehensif berbasis AI untuk perencanaan masa depan siswa"
            center
          />
          <div className="mt-8 grid flex-1 grid-cols-4 gap-5">
            {FEATURES.map(([title, description, icon]) => (
              <div
                key={title}
                className="flex flex-col justify-center rounded-2xl border border-white/8 bg-[#161616] p-6"
              >
                <span className="grid size-11 place-items-center rounded-xl border border-white/8 bg-[#111111] text-zinc-300">
                  {icon}
                </span>
                <p className="mt-5 text-[18px] font-medium leading-snug text-white">
                  {title}
                </p>
                <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <Note>
            Tidak hanya tes, fitur kami mencakup AI chatbot yang menjawab dilema
            siswa berdasarkan data kampus terkini dan rencana aksi yang konkret.
          </Note>
        </Slide>

        <Slide n={7}>
          <div className="flex items-start justify-between gap-10">
            <div>
              <p className="text-[16px] font-medium text-zinc-400">
                Fitur Desain
              </p>
              <h1 className="mt-3 text-[44px] font-semibold leading-[1.1] tracking-tight text-white">
                Tampilan Antarmuka Aplikasi
              </h1>
            </div>
            <ul className="mt-1 w-[520px] shrink-0 space-y-3.5">
              <Bullet size={19}>
                Dashboard gelap minimalis yang fokus.
              </Bullet>
              <Bullet size={19}>
                Visualisasi data yang ramah bagi siswa SMA.
              </Bullet>
              <Bullet size={19}>Desain mobile-first.</Bullet>
            </ul>
          </div>
          <div className="mt-7 flex flex-1 items-end gap-6">
            <ScreenshotFrame
              src={dashboardShot}
              alt="Dashboard Terang.in"
              className="h-[384px] w-[614px] shrink-0"
            />
            <ScreenshotFrame
              src={chatShot}
              alt="Chat Tera di layar ponsel"
              className="h-[384px] w-[178px] shrink-0"
            />
          </div>
        </Slide>

        <Slide n={8}>
          <div className="flex flex-1 items-center gap-12">
            <ScreenshotFrame
              src={analisisShot}
              alt="Hasil analisis Terang.in"
              className="h-[440px] w-[704px] shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[16px] font-medium text-zinc-400">
                Demo Produk
              </p>
              <h1 className="mt-3 text-[44px] font-semibold leading-[1.1] tracking-tight text-white">
                Demo Produk
              </h1>
              <p className="mt-4 text-[18px] leading-relaxed text-zinc-300">
                Mari kita lihat bagaimana Terang.in bekerja dalam hitungan detik
                untuk memberikan rekomendasi jurusan yang paling pas.
              </p>
              <ul className="mt-6 space-y-3.5">
                <Bullet size={19}>Interaksi chatbot yang responsif</Bullet>
                <Bullet size={19}>
                  Dashboard hasil analisis yang intuitif
                </Bullet>
              </ul>
            </div>
          </div>
        </Slide>

        <Slide n={9}>
          <Heading
            title="Teknologi di Balik Terang.in"
            sub="Modern tech stack untuk performa dan skalabilitas"
            center
          />
          <div className="mt-8 grid flex-1 grid-cols-4 gap-5">
            {STACK.map(([title, description, icon]) => (
              <div
                key={title}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#161616] p-7 text-center"
              >
                <span className="grid size-14 place-items-center rounded-2xl border border-white/8 bg-[#111111] text-zinc-300">
                  {icon}
                </span>
                <p className="mt-5 text-[18px] font-medium text-white">
                  {title}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <Note>
            Kami membangun aplikasi ini dengan teknologi modern untuk
            memastikan performa yang cepat, aman, dan skalabel.
          </Note>
        </Slide>

        <Slide n={10}>
          <Heading
            title="Mengapa Terang.in Unggul?"
            sub="Keunggulan platform dibandingkan kompetitor"
            center
          />
          <div className="mt-8 grid flex-1 grid-cols-4 gap-5">
            {ADVANTAGES.map(([title, description], index) => (
              <div
                key={title}
                className="flex flex-col justify-center rounded-2xl border border-white/8 bg-[#161616] p-6"
              >
                <span className="grid size-10 place-items-center rounded-lg border border-white/10 text-[15px] tabular-nums text-zinc-300">
                  {index + 1}
                </span>
                <p className="mt-5 text-[18px] font-medium leading-snug text-white">
                  {title}
                </p>
                <p className="mt-2.5 text-[15px] leading-relaxed text-zinc-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Slide>

        <Slide n={11}>
          <Heading title="Dampak Sosial bagi Pendidikan" />
          <div className="flex flex-1 flex-col justify-center">
            <IndexRow index={0}>
              Mengurangi risiko salah jurusan di tingkat universitas.
            </IndexRow>
            <IndexRow index={1}>
              Pemerataan akses bimbingan karier berkualitas.
            </IndexRow>
            <IndexRow index={2}>Membangun kepercayaan diri siswa.</IndexRow>
          </div>
        </Slide>

        <Slide n={12}>
          <Heading
            title="Model Bisnis & Masa Depan"
            sub="Keberlanjutan Akses Pendidikan bagi Siswa di Indonesia"
          />
          <div className="flex flex-1 flex-col justify-center">
            <div className="flex items-start gap-8 border-t border-white/8 py-9">
              <span className="pt-2 text-[15px] tabular-nums text-zinc-600">
                01
              </span>
              <div>
                <p className="text-[26px] font-medium tracking-tight text-white">
                  Tahap Awal: Model Akses
                </p>
                <p className="mt-2.5 max-w-[880px] text-[18px] leading-relaxed text-zinc-400">
                  Setiap kali menganalisis harus membayar 15.000.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-8 border-t border-white/8 py-9">
              <span className="pt-2 text-[15px] tabular-nums text-zinc-600">
                02
              </span>
              <div>
                <p className="text-[26px] font-medium tracking-tight text-white">
                  Tahap Pengembangan: Skalabilitas
                </p>
                <p className="mt-2.5 max-w-[880px] text-[18px] leading-relaxed text-zinc-400">
                  Memperluas jangkauan akses ke seluruh siswa di Indonesia.
                </p>
              </div>
            </div>
          </div>
        </Slide>
      </main>
      <PitchToolbar />
    </>
  );
}
