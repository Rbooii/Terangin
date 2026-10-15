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

const themeScript = `(function(){try{var stored=localStorage.getItem("terangin-theme");var light=stored?stored==="light":window.matchMedia("(prefers-color-scheme: light)").matches;if(light){document.documentElement.classList.add("light")}}catch(error){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
