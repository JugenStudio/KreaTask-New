import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config'; // Import the edge-safe config

// This file combines the edge-safe config with the server-only PrismaAdapter.
// The handlers (GET, POST) are used by the API route and can safely access the database.

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks, // include the edge-safe callbacks
    async session({ session, user }) {
      // The `user` object here is from the database via the adapter
      if (session.user) {
        session.user.id = user.id;
        (session.user as any).role = user.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
        if (account?.provider === 'google') {
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email! },
            });
            if (existingUser) {
                return true; // User exists, sign in is allowed
            }
            // If user doesn't exist, NextAuth + PrismaAdapter will create them.
        }
        return true; // Allow sign in for credentials and existing Google users
    }
  },
});
