import Link from "next/link";
import FadeIn from "./FadeIn";
import { TeraMark } from "./TeraMark";
import { ArrowDown, ArrowUp } from "./icons";

export default function Hero() {
  return (
    <section className="relative px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <h1 className="flex items-center justify-center gap-3 text-4xl font-semibold tracking-tight text-white sm:gap-4 sm:text-6xl">
            Meet
            <TeraMark className="size-10 shrink-0 sm:size-14" />
            Tera
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
            Teman ngobrol yang bantu kamu paham diri sendiri, biar milih
            jurusan nggak lagi asal ikut-ikutan
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-7 flex items-center justify-center gap-2.5">
            <a
              href="#preview"
              className="flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Try it Now
              <ArrowDown className="size-3.5" />
            </a>
            <Link
              href="/login"
              className="flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-[#1a1a1a] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#242424]"
            >
              Ask Us
              <ArrowUp className="size-3.5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
