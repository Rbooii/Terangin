import Link from "next/link";
import FadeIn from "./FadeIn";

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Pricing
          </h2>
        </FadeIn>

        <div className="mt-12 flex flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-16">
          <FadeIn delay={0.1} className="w-full max-w-[260px]">
            <div className="rounded-2xl border border-white/6 bg-[#161616] p-6">
              <p className="text-[13px] text-zinc-400">Terang.in</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Rp 15k
                <span className="ml-1 align-super text-xs font-normal text-zinc-500">
                  /Sesi
                </span>
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Billed Per Session
              </p>
              <Link
                href="/signup"
                className="mt-6 flex h-10 items-center justify-center rounded-full bg-white text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Get Terang.in
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h3 className="max-w-md text-center text-2xl font-medium leading-snug tracking-tight text-white sm:text-left sm:text-[28px]">
              Terang.in Hanya NgeCharge Kamu Sekali Per Konsultasi
            </h3>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
