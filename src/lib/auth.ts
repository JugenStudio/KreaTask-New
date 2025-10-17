import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';

const prisma = new PrismaClient();

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

        if (!user) {
          return null;
        }
        
        // IMPORTANT: In a real app, you MUST hash passwords.
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const paths = [
        '/dashboard', 
        '/tasks', 
        '/submit', 
        '/leaderboard', 
        '/performance-report', 
        '/profile', 
        '/settings', 
        '/about', 
        '/downloads'
      ];
      const isProtected = paths.some(path => nextUrl.pathname.startsWith(path));

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL('/landing', nextUrl.origin);
        redirectUrl.searchParams.append('callbackUrl', nextUrl.pathname);
        return Response.redirect(redirectUrl);
      }
      return true;
    },
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
  secret: process.env.AUTH_SECRET, // Changed from NEXTAUTH_SECRET to AUTH_SECRET for v5
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
