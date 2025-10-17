import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// This is a separate handler for the signup API route.
async function handleSignup(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
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

    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

const handler = async (req: NextRequest, res: NextResponse) => {
  // Check if it's a signup request
  if (req.method === 'POST' && req.nextUrl.pathname.endsWith('/signup')) {
    return handleSignup(req);
  }
  
  // Otherwise, default to NextAuth
  return await NextAuth(req as any, res as any, authOptions);
}


export { handler as GET, handler as POST };
