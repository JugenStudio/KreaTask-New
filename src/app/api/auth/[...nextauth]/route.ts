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
      return Response.json({ message: 'User already exists' }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // This should be a hashed password in a real app
        role: UserRole.UNASSIGNED,
        jabatan: 'Unassigned',
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/100/100`,
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
  if (pathname.endsWith('/signup')) {
    return handleSignup(request);
  }
  // Fallback to NextAuth handlers for other POST requests (e.g., credentials sign-in)
  return handlers.POST(request);
}

// Export GET handler from NextAuth
export const GET = handlers.GET;
