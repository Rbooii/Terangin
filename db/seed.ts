import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { questions } from "./schema";

type SeedQuestion = {
  category: "MINAT" | "BAKAT" | "KEPRIBADIAN" | "GAYA_BELAJAR";
  questionText: string;
};

let orderIndex = 0;

const QUESTION_BANK: SeedQuestion[] = [
  // MINAT (RIASEC: Investigative, Artistic, Social, Enterprising, Conventional, Realistic)
  {
    category: "MINAT",
    questionText:
      "Aku penasaran sama cara kerja teknologi, mesin, atau fenomena alam, dan sering cari tahu sendiri sampai paham.",
  },
  {
    category: "MINAT",
    questionText:
      "Aku suka bikin sesuatu yang visual atau kreatif, kayak gambar, desain, musik, atau cerita.",
  },
  {
    category: "MINAT",
    questionText:
      "Aku senang bantu orang lain belajar atau menyelesaikan masalahnya.",
  },
  {
    category: "MINAT",
    questionText:
      "Aku tertarik sama dunia bisnis, jualan, atau memimpin sebuah tim.",
  },
  {
    category: "MINAT",
    questionText:
      "Aku nyaman kerja dengan data, catatan, atau aturan yang rapi dan terstruktur.",
  },
  {
    category: "MINAT",
    questionText:
      "Aku suka kegiatan yang praktik langsung, kayak merakit, berkebun, olahraga, atau kerja lapangan.",
  },

  // KEPRIBADIAN
  {
    category: "KEPRIBADIAN",
    questionText:
      "Aku semangat kalau ketemu banyak orang, dan capek kalau kelamaan sendirian.",
  },
  {
    category: "KEPRIBADIAN",
    questionText:
      "Aku suka rencana yang jelas sebelum mulai, dibanding ngikutin alur aja.",
  },
  {
    category: "KEPRIBADIAN",
    questionText:
      "Aku berani ambil risiko buat hal yang aku percaya, walau belum tentu berhasil.",
  },
  {
    category: "KEPRIBADIAN",
    questionText:
      "Kalau gagal, aku biasanya nyoba lagi dengan cara lain sampai berhasil.",
  },
  {
    category: "KEPRIBADIAN",
    questionText: "Aku lebih nyaman kerja dalam tim dibanding sendirian.",
  },
  {
    category: "KEPRIBADIAN",
    questionText:
      "Aku memutuskan sesuatu setelah mikir untung-ruginya, bukan ikut perasaan aja.",
  },

  // BAKAT (kemampuan dasar, self-efficacy ala Flanagan: numerik, verbal, spasial, mekanikal, data, memori)
  {
    category: "BAKAT",
    questionText: "Aku cepat nemu pola di deret angka atau data.",
  },
  {
    category: "BAKAT",
    questionText:
      "Aku gampang paham maksud bacaan yang panjang, bahkan yang bahasanya agak rumit.",
  },
  {
    category: "BAKAT",
    questionText:
      "Aku bisa bayangin bentuk atau ruang di kepala, misal cara nyusun barang biar muat.",
  },
  {
    category: "BAKAT",
    questionText: "Aku gampang paham cara kerja alat, mesin, atau aplikasi baru.",
  },
  {
    category: "BAKAT",
    questionText:
      "Aku bisa lihat mana informasi penting dari tabel atau data yang banyak.",
  },
  {
    category: "BAKAT",
    questionText:
      "Aku kuat mengingat detail, kayak angka, nama, atau langkah-langkah.",
  },

  // GAYA_BELAJAR
  {
    category: "GAYA_BELAJAR",
    questionText:
      "Aku lebih cepat paham materi kalau ada gambar, diagram, atau video.",
  },
  {
    category: "GAYA_BELAJAR",
    questionText:
      "Aku paham materi kalau dijelaskan lewat suara atau aku baca ulang dengan lantang.",
  },
  {
    category: "GAYA_BELAJAR",
    questionText: "Aku lebih paham kalau langsung praktik atau mencoba sendiri.",
  },
  {
    category: "GAYA_BELAJAR",
    questionText:
      "Aku suka belajar dari contoh soal dan mengerjakannya berkali-kali.",
  },
  {
    category: "GAYA_BELAJAR",
    questionText: "Aku lebih fokus belajar sendiri dibanding berkelompok.",
  },
  {
    category: "GAYA_BELAJAR",
    questionText:
      "Aku senang mendiskusikan materi dengan teman supaya lebih paham.",
  },
];

async function main() {
  const force = process.argv.includes("--force");
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions);

  if (existing.count > 0 && !force) {
    console.log(
      `Bank soal sudah terisi (${existing.count} soal). Pakai --force kalau mau isi ulang.`,
    );
    await client.end();
    return;
  }

  if (force && existing.count > 0) {
    console.warn(
      "Peringatan: --force menghapus semua soal. Jawaban user ikut terhapus (cascade).",
    );
    await db.delete(questions);
  }

  orderIndex = 0;
  await db.insert(questions).values(
    QUESTION_BANK.map((question) => ({
      ...question,
      orderIndex: ++orderIndex,
    })),
  );

  console.log(`Selesai: ${QUESTION_BANK.length} soal dimasukkan ke bank soal.`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
