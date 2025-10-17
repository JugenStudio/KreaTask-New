import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}