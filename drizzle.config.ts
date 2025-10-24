import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "41b972cc-e921-4551-83c0-33997a655fc1",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
