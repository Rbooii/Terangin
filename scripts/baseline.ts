import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

loadEnvConfig(process.cwd());

type JournalEntry = { when: number; tag: string };
type Journal = { entries: JournalEntry[] };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL tidak diatur. Baseline dibatalkan.");
    process.exit(1);
  }

  const migrationsDir = join(process.cwd(), "db", "migrations");
  const journal = JSON.parse(
    readFileSync(join(migrationsDir, "meta", "_journal.json"), "utf8"),
  ) as Journal;

  if (journal.entries.length === 0) {
    console.error("Tidak ada migrasi di db/migrations. Jalankan npm run db:generate dulu.");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  try {
    const existing = await client<{ name: string | null }[]>`
      select to_regclass('drizzle.__drizzle_migrations')::text as name
    `;

    if (existing[0]?.name) {
      const rows = await client<{ count: number }[]>`
        select count(*)::int as count from drizzle.__drizzle_migrations
      `;
      if ((rows[0]?.count ?? 0) > 0) {
        console.error("Database sudah punya riwayat migrasi. Baseline tidak diperlukan.");
        process.exit(1);
      }
    }

    await client`create schema if not exists drizzle`;
    await client`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `;

    for (const entry of journal.entries) {
      const sql = readFileSync(join(migrationsDir, `${entry.tag}.sql`), "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      await client`
        insert into drizzle.__drizzle_migrations (hash, created_at)
        values (${hash}, ${entry.when})
      `;
      console.log(`Ditandai sudah diterapkan tanpa dijalankan: ${entry.tag}`);
    }

    console.log(`${journal.entries.length} migrasi di-baseline. Migrasi baru berikutnya akan berjalan normal.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Baseline gagal:", error);
  process.exit(1);
});
