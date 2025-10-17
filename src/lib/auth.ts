import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/lib/prisma'; // Import the singleton instance

// This is the authentication configuration.
// It is used to initialize the NextAuth handlers.
export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }
        
        // In a real app, hash and compare passwords. This is for demonstration.
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

// handlers contains the GET and POST methods that interact with the database.
// DO NOT import this into middleware. Only use it in API routes.
// auth, signIn, and signOut are edge-compatible helpers.
export const { handlers, auth, signIn, signOut } = NextAuth(config);