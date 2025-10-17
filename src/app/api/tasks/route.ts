import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { useAuth } from '@stackframe/stack/use-auth';
import { isEmployee } from '@/lib/roles';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { user: authUser } = useAuth(request);

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = authUser.id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId }});
  
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
  }

  const userRole = dbUser.role;

  try {
    let whereClause: Prisma.TaskWhereInput = {};

    if (isEmployee(userRole)) {
      whereClause = {
        assignees: {
          some: {
            id: userId,
          },
        },
      };
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignees: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, jabatan: true }
        },
        revisions: { include: { author: true } },
        comments: { include: { author: true } },
        files: true,
        subtasks: true,
      },
       orderBy: {
        createdAt: 'desc'
      }
    });

    // Remap to match the old LocalizedString structure for minimal frontend changes
    const mappedTasks = tasks.map(task => ({
      ...task,
      title: { en: task.titleEn, id: task.titleId },
      description: { en: task.descriptionEn, id: task.descriptionId },
      revisions: task.revisions.map(r => ({
        ...r,
        change: { en: r.changeEn, id: r.changeId }
      })),
      comments: task.comments.map(c => ({
        ...c,
        content: { en: c.contentEn, id: c.contentId }
      }))
    }));

    return NextResponse.json(mappedTasks);

  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const { user: authUser } = useAuth(request);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        
        const { title, description, status, assignees, dueDate, category, value, valueCategory, evaluator, files, subtasks } = body;
        
        const newTaskId = `task-${Date.now()}`;

        const createdTask = await prisma.task.create({
            data: {
                id: newTaskId,
                titleEn: title.en,
                titleId: title.id,
                descriptionEn: description.en,
                descriptionId: description.id,
                status: status,
                category: category,
                dueDate: new Date(dueDate),
                value: value,
                valueCategory: valueCategory,
                evaluator: evaluator,
                assignees: {
                    connect: assignees.map((a: {id: string}) => ({ id: a.id }))
                },
                files: {
                    create: files.map((f: any) => ({
                        id: f.id,
                        name: f.name,
                        type: f.type,
                        url: f.url,
                        size: f.size,
                    }))
                },
                subtasks: {
                    create: subtasks.map((st: any) => ({
                        id: st.id,
                        title: st.title,
                        isCompleted: st.isCompleted,
                    }))
                }
            }
        });

        return NextResponse.json(createdTask, { status: 201 });

    } catch (error) {
        console.error('Failed to create task:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
