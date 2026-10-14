import FadeIn from "./FadeIn";
import { TeraMark } from "./TeraMark";

export default function Testimonial() {
  return (
    <section className="px-4 pt-20 sm:px-6 sm:pt-28">
      <FadeIn>
        <div className="relative mx-auto max-w-5xl rounded-3xl bg-[#161616] px-7 py-12 sm:px-12 sm:py-16">
          <div className="max-w-2xl pt-14 sm:pt-0">
            <h2 className="text-2xl font-medium tracking-tight text-white sm:text-[28px]">
              Ngobrol sama Tera kayak ngobrol sama Teman
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              Tanya apa aja. &ldquo;Kenapa aku cocok di Psikologi?&rdquo;,
              &ldquo;Beda Informatika sama Sistem Informasi apa sih?&rdquo;
              Tera jawab pakai data dirimu sendiri, bukan jawaban generik.
            </p>
          </div>
          <TeraMark className="absolute -top-6 -right-3 size-24 sm:-right-12 sm:-top-14 sm:size-56" />
        </div>
      </FadeIn>
    </section>
  );
}
