import type { ReactNode } from "react";
import FadeIn from "./FadeIn";
import {
  AnalysisMock,
  AssessmentMock,
  ChatMock,
  SignupMock,
} from "./feature-mocks";

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
      <div className="flex h-full flex-col rounded-2xl border border-overlay/6 bg-surface p-6 sm:p-7">
        <h3 className="text-[15px] font-medium text-fg">{title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-1 flex-col justify-end">{children}</div>
      </div>
    </FadeIn>
  );
}

export default function Features() {
  return (
    <section id="fitur" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-fg sm:text-4xl">
            Terang.in Mudah Dipakai
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-[15px]">
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
