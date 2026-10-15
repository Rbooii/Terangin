import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import SignupForm from "@/components/auth/SignupForm";
import { TeraMark } from "@/components/landing/TeraMark";

export const instant = false;

export const metadata: Metadata = {
  title: "Daftar di Terang.in",
  description: "Daftar akun Terang.in dan mulai kenalan sama Tera.",
};

export default async function SignupPage() {
  await connection();
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <TeraMark className="size-12" />
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-fg"
          >
            Terang<span className="text-fg-faint">.in</span>
          </Link>
        </div>

        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-fg">
          Bikin akun baru
        </h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-fg-muted">
          Kenalan dulu sama Tera, cuma butuh setengah menit.
        </p>

        <SignupForm />

        <p className="mt-6 text-center text-[13px] text-fg-faint">
          Udah punya akun?{" "}
          <Link
            href="/login"
            className="text-fg underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </p>

        <p className="mt-12 text-center">
          <Link
            href="/"
            className="text-[12px] text-fg-faintest transition-colors hover:text-fg-muted"
          >
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
