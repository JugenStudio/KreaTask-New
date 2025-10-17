import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    try {
        const body = await request.json();
        const { name, email, avatarUrl } = body;
        
        const data: {name?: string, email?: string, avatarUrl?: string} = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (avatarUrl) data.avatarUrl = avatarUrl;
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: data
        });

        const { password, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        console.error("Failed to update user profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
