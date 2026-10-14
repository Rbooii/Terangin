import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terang.in: Teman ngobrol buat pilih jurusan",
  description:
    "Platform analisis dan chatbot AI yang bantu siswa SMA paham diri sendiri, memilih jurusan kuliah dengan yakin, dan menyusun rencana yang realistis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
