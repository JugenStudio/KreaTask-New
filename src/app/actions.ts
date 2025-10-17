'use server';

import { neon } from '@neondatabase/serverless';

export async function getUserDetails(userId: string | undefined) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!userId) {
    return null;
  }

  // Note: The table is `users` as per your Prisma schema, not `neon_auth.users_sync`
  const sql = neon(process.env.DATABASE_URL!);
  const [user] = await sql`SELECT * FROM "User" WHERE id = ${userId};`;
  
  // The result from neon/serverless might need property name mapping if they are different
  // e.g., mapping raw_json to avatarUrl if needed, but your table seems direct.
  return user;
}
