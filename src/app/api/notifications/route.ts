import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, userId, message, type, read, link, taskId, createdAt } = body;

        // Basic validation
        if (!userId || !message || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newNotification = await prisma.notification.create({
            data: {
                id,
                userId,
                message,
                type,
                read: read || false,
                link,
                taskId,
                createdAt: createdAt ? new Date(createdAt) : new Date(),
            },
        });

        return NextResponse.json(newNotification, { status: 201 });
    } catch (error) {
        console.error('Failed to create notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notificationsToUpdate: { id: string, read: boolean }[] = await request.json();

        if (!Array.isArray(notificationsToUpdate) || notificationsToUpdate.length === 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const idsToUpdate = notificationsToUpdate.map(n => n.id);
        
        const result = await prisma.notification.updateMany({
            where: {
                id: { in: idsToUpdate },
                userId: (session.user as any).id, // Ensure user can only update their own notifications
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error('Failed to update notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
