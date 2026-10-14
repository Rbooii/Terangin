import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { TeraMark } from "@/components/landing/TeraMark";

export const metadata: Metadata = {
  title: "Masuk ke Terang.in",
  description: "Masuk ke akun Terang.in dan lanjut ngobrol sama Tera.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <TeraMark className="size-12" />
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-white"
          >
            Terang<span className="text-zinc-500">.in</span>
          </Link>
        </div>

        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-white">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-zinc-400">
          Tera udah nungguin. Lanjut obrolanmu, yuk.
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-[13px] text-zinc-500">
          Belum punya akun?{" "}
          <Link
            href="/signup"
            className="text-white underline-offset-4 hover:underline"
          >
            Daftar
          </Link>
        </p>

        <p className="mt-12 text-center">
          <Link
            href="/"
            className="text-[12px] text-zinc-600 transition-colors hover:text-zinc-400"
          >
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
