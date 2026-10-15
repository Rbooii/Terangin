import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { questions } from "./schema";

type SeedQuestion = {
  category: "MINAT" | "BAKAT" | "KEPRIBADIAN" | "GAYA_BELAJAR";
  questionText: string;
  dimension: string;
};

let orderIndex = 0;

const QUESTION_BANK: SeedQuestion[] = [
  // MINAT (RIASEC: I, A, S, E, C, R)
  {
    category: "MINAT",
    dimension: "I",
    questionText:
      "Aku penasaran sama cara kerja teknologi, mesin, atau fenomena alam, dan sering cari tahu sendiri sampai paham.",
  },
  {
    category: "MINAT",
    dimension: "A",
    questionText:
      "Aku suka bikin sesuatu yang visual atau kreatif, kayak gambar, desain, musik, atau cerita.",
  },
  {
    category: "MINAT",
    dimension: "S",
    questionText:
      "Aku senang bantu orang lain belajar atau menyelesaikan masalahnya.",
  },
  {
    category: "MINAT",
    dimension: "E",
    questionText:
      "Aku tertarik sama dunia bisnis, jualan, atau memimpin sebuah tim.",
  },
  {
    category: "MINAT",
    dimension: "C",
    questionText:
      "Aku nyaman kerja dengan data, catatan, atau aturan yang rapi dan terstruktur.",
  },
  {
    category: "MINAT",
    dimension: "R",
    questionText:
      "Aku suka kegiatan yang praktik langsung, kayak merakit, berkebun, olahraga, atau kerja lapangan.",
  },

  // KEPRIBADIAN
  {
    category: "KEPRIBADIAN",
    dimension: "sosial",
    questionText:
      "Aku semangat kalau ketemu banyak orang, dan capek kalau kelamaan sendirian.",
  },
  {
    category: "KEPRIBADIAN",
    dimension: "terencana",
    questionText:
      "Aku suka rencana yang jelas sebelum mulai, dibanding ngikutin alur aja.",
  },
  {
    category: "KEPRIBADIAN",
    dimension: "pemberani",
    questionText:
      "Aku berani ambil risiko buat hal yang aku percaya, walau belum tentu berhasil.",
  },
  {
    category: "KEPRIBADIAN",
    dimension: "tangguh",
    questionText:
      "Kalau gagal, aku biasanya nyoba lagi dengan cara lain sampai berhasil.",
  },
  {
    category: "KEPRIBADIAN",
    dimension: "kolaboratif",
    questionText: "Aku lebih nyaman kerja dalam tim dibanding sendirian.",
  },
  {
    category: "KEPRIBADIAN",
    dimension: "rasional",
    questionText:
      "Aku memutuskan sesuatu setelah mikir untung-ruginya, bukan ikut perasaan aja.",
  },

  // BAKAT (kemampuan dasar ala Flanagan: numerik, verbal, spasial, mekanikal, data, memori)
  {
    category: "BAKAT",
    dimension: "numerik",
    questionText: "Aku cepat nemu pola di deret angka atau data.",
  },
  {
    category: "BAKAT",
    dimension: "verbal",
    questionText:
      "Aku gampang paham maksud bacaan yang panjang, bahkan yang bahasanya agak rumit.",
  },
  {
    category: "BAKAT",
    dimension: "spasial",
    questionText:
      "Aku bisa bayangin bentuk atau ruang di kepala, misal cara nyusun barang biar muat.",
  },
  {
    category: "BAKAT",
    dimension: "mekanikal",
    questionText: "Aku gampang paham cara kerja alat, mesin, atau aplikasi baru.",
  },
  {
    category: "BAKAT",
    dimension: "data",
    questionText:
      "Aku bisa lihat mana informasi penting dari tabel atau data yang banyak.",
  },
  {
    category: "BAKAT",
    dimension: "memori",
    questionText:
      "Aku kuat mengingat detail, kayak angka, nama, atau langkah-langkah.",
  },

  // GAYA_BELAJAR
  {
    category: "GAYA_BELAJAR",
    dimension: "visual",
    questionText:
      "Aku lebih cepat paham materi kalau ada gambar, diagram, atau video.",
  },
  {
    category: "GAYA_BELAJAR",
    dimension: "auditori",
    questionText:
      "Aku paham materi kalau dijelaskan lewat suara atau aku baca ulang dengan lantang.",
  },
  {
    category: "GAYA_BELAJAR",
    dimension: "praktik",
    questionText: "Aku lebih paham kalau langsung praktik atau mencoba sendiri.",
  },
  {
    category: "GAYA_BELAJAR",
    dimension: "latihan",
    questionText:
      "Aku suka belajar dari contoh soal dan mengerjakannya berkali-kali.",
  },
  {
    category: "GAYA_BELAJAR",
    dimension: "mandiri",
    questionText: "Aku lebih fokus belajar sendiri dibanding berkelompok.",
  },
  {
    category: "GAYA_BELAJAR",
    dimension: "diskusi",
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
    // Jalur aman: jangan hapus bank soal, cukup terapkan tag dimensi
    // berdasarkan kecocokan teks (idempotent, jawaban user tidak tersentuh).
    console.log(
      `Bank soal sudah terisi (${existing.count} soal). Menerapkan tag dimensi...`,
    );
    let updated = 0;
    for (const question of QUESTION_BANK) {
      const result = await db
        .update(questions)
        .set({ dimension: question.dimension })
        .where(eq(questions.questionText, question.questionText))
        .returning({ id: questions.id });
      updated += result.length;
    }
    console.log(`Tag dimensi diperbarui untuk ${updated} soal.`);
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
