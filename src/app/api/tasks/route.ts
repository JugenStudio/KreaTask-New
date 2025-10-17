import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isEmployee } from '@/lib/roles';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    let tasks;
    if (isEmployee(userRole)) {
      // Employees see only their tasks
      tasks = await prisma.task.findMany({
        where: {
          assignees: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          assignees: true,
          revisions: { include: { author: true } },
          comments: { include: { author: true } },
          files: true,
          subtasks: true,
        },
      });
    } else {
      // Directors and Admins see all tasks
      tasks = await prisma.task.findMany({
        include: {
          assignees: true,
          revisions: { include: { author: true } },
          comments: { include: { author: true } },
          files: true,
          subtasks: true,
        },
      });
    }
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}