import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isEmployee } from '@/lib/roles';

// UPDATE a user
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Authorization: Only non-employees can update user roles
  if (isEmployee((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const updates = await request.json();
    const { role, name, email } = updates;

    const data: { role?: string, name?: string, email?: string } = {};
    if (role) data.role = role;
    if (name) data.name = name;
    if (email) data.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: data,
    });
    
    // Exclude password from the response
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error(`Failed to update user ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isEmployee((session.user as any).role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await prisma.user.delete({
            where: { id: params.id },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to delete user ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
