import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { useAuth } from '@stackframe/stack/use-auth';
import { isEmployee } from '@/lib/roles';

// UPDATE a user
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user: authUser } = useAuth(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const currentUser = await prisma.user.findUnique({ where: { id: authUser.id }});
  
  if (!currentUser || isEmployee(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const updates = await request.json();
    const { role, name, email, avatarUrl } = updates;

    const data: { role?: string, name?: string, email?: string, avatarUrl?: string } = {};
    if (role) data.role = role;
    if (name) data.name = name;
    if (email) data.email = email;
    if (avatarUrl) data.avatarUrl = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: data,
    });
    
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error(`Failed to update user ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { user: authUser } = useAuth(request);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = await prisma.user.findUnique({ where: { id: authUser.id }});

    if (!currentUser || isEmployee(currentUser.role)) {
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
