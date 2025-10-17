import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/lib/prisma'; // Import the singleton instance

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

        if (!user || !user.password) { // Check if user and password exist
          return null;
        }
        
        // IMPORTANT: In a real app, you MUST hash passwords and compare them securely.
        // This is a placeholder for demonstration purposes.
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // Pass the role to the session token
        };
      },
    }),
  ],
  callbacks: {
    // The `authorized` callback is handled by the middleware.
    // It's cleaner to keep route protection logic in `middleware.ts`.
    
    // The JWT callback is invoked when a token is created.
    // We add the user's ID and role to the token here.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    // The session callback is invoked when a session is checked.
    // We add the custom data from the token (id and role) to the session object.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role; // Now role is available in the session
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin', // Direct users to our custom sign-in page
  },
  session: {
    strategy: 'jwt', // Using JWT for session management is required for middleware
  },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

// handlers is an object containing GET and POST methods
export const { handlers, auth, signIn, signOut } = NextAuth(config);
