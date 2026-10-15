import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL tidak diatur. Migrasi dibatalkan.");
    process.exit(1);
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const force = process.env.FORCE_MIGRATE === "1";

  if (vercelEnv && vercelEnv !== "production" && !force) {
    console.log(
      `VERCEL_ENV=${vercelEnv}: migrasi dilewati, hanya dijalankan untuk production. Pakai FORCE_MIGRATE=1 untuk memaksa.`,
    );
    return;
  }

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
    console.log("Migrasi selesai, schema database sudah terbaru.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migrasi gagal:", error);
  process.exit(1);
});
