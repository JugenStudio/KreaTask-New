import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isEmployee } from '@/lib/roles';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Only allow non-employees to fetch the full user list
  if (isEmployee(userRole)) {
     // Return only the current user if they are an employee
     try {
         const user = await prisma.user.findUnique({
             where: { id: (session.user as any).id },
             select: { id: true, name: true, email: true, avatarUrl: true, role: true, jabatan: true }
         });
         return NextResponse.json(user ? [user] : []);
     } catch (error) {
         console.error('Failed to fetch self:', error);
         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
     }
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        jabatan: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
