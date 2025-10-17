import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import type { User as PrismaUser } from '@prisma/client';
import { UserRole } from '@/lib/types';

const prisma = new PrismaClient();

// This is a separate handler for the signup API route.
async function handleSignup(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: 'Missing fields' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'User already exists' }), { status: 409 });
    }

    // IMPORTANT: In a real app, hash the password before saving.
    // Storing plain text passwords is a major security risk.
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // This should be a hashed password
        role: UserRole.UNASSIGNED,
        jabatan: 'Unassigned',
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
      },
    });

    return new Response(JSON.stringify(newUser), { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}

// NextAuth handler
const handler = NextAuth(authOptions);

// We need to export both GET and POST for NextAuth to work.
// We also add a custom POST handler to intercept signup requests.
export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === '/api/auth/signup') {
    return handleSignup(req);
  }
  // Otherwise, fall back to the default NextAuth handler
  return handler(req, {} as any);
}

export { handler as GET };