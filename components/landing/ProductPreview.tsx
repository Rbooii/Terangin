import FadeIn from "./FadeIn";
import { TeraMark } from "./TeraMark";
import { SendIcon } from "./icons";

const steps = [
  { n: 1, title: "Onboarding", status: "Done", state: "done" },
  { n: 2, title: "Assessment Bakat", status: "Done", state: "done" },
  {
    n: 3,
    title: "Input Nilai",
    status: "Not yet Completed",
    state: "active",
  },
  {
    n: 4,
    title: "Hasil Analisis",
    status: "Not yet Completed",
    state: "todo",
  },
] as const;

export default function ProductPreview() {
  return (
    <section id="preview" className="px-4 pt-12 sm:px-6 sm:pt-16">
      <FadeIn>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/8 bg-[#141414] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr]">
            <div className="flex flex-col border-b border-white/6 p-5 sm:p-6 md:border-b-0 md:border-r">
              <div className="flex items-center gap-2">
                <TeraMark className="size-4" />
                <span className="text-[13px] font-medium text-zinc-200">
                  Terang<span className="text-zinc-500">.in</span>
                </span>
              </div>

              <ol className="relative mt-8 space-y-1">
                <span
                  aria-hidden="true"
                  className="absolute bottom-6 left-8 top-6 w-px bg-white/10"
                />
                {steps.map((step) => (
                  <li
                    key={step.n}
                    className={
                      step.state === "active"
                        ? "relative flex items-center gap-4 rounded-xl border border-white/12 bg-[#1e1e1e] px-3.5 py-3"
                        : "relative flex items-center gap-4 px-3.5 py-3"
                    }
                  >
                    <span
                      className={
                        step.state === "active"
                          ? "grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[13px] font-medium text-black"
                          : "grid size-9 shrink-0 place-items-center rounded-lg bg-white/6 text-[13px] text-zinc-400"
                      }
                    >
                      {step.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-zinc-200">
                        {step.title}
                      </span>
                      <span
                        className={
                          step.state === "done"
                            ? "flex items-center gap-1.5 text-[11px] text-zinc-400"
                            : "block text-[11px] text-zinc-500"
                        }
                      >
                        {step.state === "done" && (
                          <span className="size-1.5 rounded-full bg-emerald-400/80" />
                        )}
                        {step.status}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-10 space-y-3 md:mt-auto md:pt-12">
                <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#1b1b1b] p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
                    <TeraMark className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-zinc-200">
                      Chat With Tera
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">
                      Kenalan dulu sama Tera, coach pribadimu.
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 px-1">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[10px] font-semibold text-black">
                    MK
                  </span>
                  <span className="flex-1 truncate text-[12px] text-zinc-300">
                    Michael Kevin
                  </span>
                  <span className="text-[11px] text-zinc-500">Mine</span>
                </div>
              </div>
            </div>

            <div className="flex min-h-[420px] flex-col p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <TeraMark className="size-4" />
                <span className="text-[13px] font-medium text-zinc-200">
                  Tera
                </span>
              </div>

              <div className="mt-8 flex-1 space-y-5">
                <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-[#222222] px-4 py-3 text-[13px] leading-relaxed text-zinc-300">
                  Halo! Hasil analisismu udah siap. Kamu paling kuat di
                  analisis data dan empati. Dua arah itu cocok banget buat
                  Psikologi atau Sistem Informasi.
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-[13px] leading-relaxed text-black">
                  Keren, top 3-nya masuk akal. Lanjut bahas biaya kuliah dan
                  peluang beasiswanya ya.
                </div>
              </div>

              <div className="mt-6 flex h-11 items-center gap-2 rounded-full border border-white/10 bg-[#1b1b1b] pl-4 pr-1.5">
                <input
                  type="text"
                  placeholder="Pesan Tera"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  aria-label="Kirim pesan"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200"
                >
                  <SendIcon className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
