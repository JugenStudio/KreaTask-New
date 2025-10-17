import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types';

// This is a separate handler for the signup API route.
async function handleSignup(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return Response.json({ message: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return Response.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // In a real application, you would hash the password here before saving it.
    // Example using bcrypt:
    // const bcrypt = require('bcrypt');
    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: password, // Store password directly (DEMO ONLY - NOT FOR PRODUCTION)
        role: UserRole.UNASSIGNED,
        jabatan: 'Unassigned',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return Response.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.includes('/signup')) {
    return handleSignup(request);
  }
  
  // Fallback to NextAuth handlers for other POST requests (e.g., credentials sign-in, OAuth callbacks)
  return handlers.POST(request);
}

// Export GET handler from NextAuth for session management, provider discovery etc.
export const GET = handlers.GET;
