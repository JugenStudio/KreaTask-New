import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { useAuth } from '@stackframe/stack/use-auth';
import { isEmployee } from '@/lib/roles';

export async function GET(request: Request) {
  const { user: authUser } = useAuth(request);

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRole = (await prisma.user.findUnique({ where: { id: authUser.id } }))?.role;
    if(!userRole) {
       return NextResponse.json({ error: 'User role not found' }, { status: 404 });
    }

    if (isEmployee(userRole)) {
     // Return only the current user if they are an employee
     try {
         const user = await prisma.user.findUnique({
             where: { id: authUser.id },
             select: { id: true, name: true, email: true, avatarUrl: true, role: true, jabatan: true }
         });
         return NextResponse.json(user ? [user] : []);
     } catch (error) {
         console.error('Failed to fetch self:', error);
         return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
     }
    }

    // For non-employees, return all users
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
