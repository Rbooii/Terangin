import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import AuthNav, { AuthButtons } from "@/components/landing/AuthNav";
import CookieBanner from "@/components/landing/CookieBanner";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import ProductPreview from "@/components/landing/ProductPreview";
import Testimonial from "@/components/landing/Testimonial";
import Wordmark from "@/components/landing/Wordmark";

export const instant = false;

export default async function Home() {
  await connection();
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <>
      <Navbar
        authSlot={
          <Suspense fallback={<AuthButtons />}>
            <AuthNav />
          </Suspense>
        }
      />
      <main className="flex-1 pb-10">
        <Hero />
        <ProductPreview />
        <Testimonial />
        <Features />
        <Pricing />
        <Wordmark />
      </main>
      <CookieBanner />
    </>
  );
}
