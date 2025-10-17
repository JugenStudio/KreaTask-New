import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { UserRole } from './lib/types';
import { prisma } from './lib/prisma';

// This file contains the NextAuth configuration that is SAFE for the Edge Runtime.
// It does NOT include the PrismaAdapter.

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.UNASSIGNED,
          jabatan: 'Unassigned',
        };
      },
    }),
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

        // We can use prisma here because authorize() only runs on the server
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }
        
        // In a real app, you'd use a library like bcrypt to compare hashes
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    // Callbacks are used by the middleware, so they must be edge-safe
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedRoutes = [
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
      const isProtectedRoute = protectedRoutes.some(path => nextUrl.pathname.startsWith(path));

      if (isProtectedRoute && !isLoggedIn) {
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
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || "super-secret-key-for-dev",
} satisfies NextAuthConfig;
