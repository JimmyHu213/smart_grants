import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Use the direct (non-pooled) connection for CLI commands like migrations.
  // The pooled DATABASE_URL is used at runtime by the Prisma Client adapter.
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
