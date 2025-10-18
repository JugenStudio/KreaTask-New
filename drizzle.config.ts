// drizzle.config.ts

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: "./src/db/schema.ts", // 👈 Point this to your schema file
  out: "./drizzle",             // 👈 Where drizzle will save the migration files
  dialect: "postgresql",        // 👈 'postgresql', 'mysql', or 'sqlite'
  dbCredentials: {
    url: process.env.DATABASE_URL!, // 👈 Your database connection string
  },
  verbose: true,
  strict: true,
});