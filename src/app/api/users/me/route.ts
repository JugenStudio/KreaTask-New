import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { useAuth } from '@stackframe/stack/use-auth';

export async function GET(request: Request) {
  const { user } = useAuth(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Here, user.id is the ID from the auth provider (e.g., Neon Auth's user ID)
    const appUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!appUser) {
      // This case might happen if the user exists in Neon Auth but not in your user sync table yet.
      // Or if the ID differs. Ensure your primary key `id` in `User` table matches Neon Auth's `user.id`.
      return NextResponse.json({ error: 'User not found in application database' }, { status: 404 });
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = appUser;
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    const { user } = useAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

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
