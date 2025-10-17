import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isEmployee } from '@/lib/roles';

// GET a single task
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { 
        assignees: true,
        revisions: { include: { author: true } },
        comments: { include: { author: true } },
        files: true,
        subtasks: true,
       },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Authorization check
    if (isEmployee((session.user as any).role) && !task.assignees.some(a => a.id === (session.user as any).id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(`Failed to fetch task ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// UPDATE a task
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();

    // Remove complex nested objects that should be handled separately
    const { assignees, revisions, comments, ...simpleUpdates } = updates;
    
    const data: any = { ...simpleUpdates };

    // Handle assignee update
    if (assignees && assignees.length > 0) {
        data.assignees = {
            set: assignees.map((a: { id: string }) => ({ id: a.id }))
        };
    }

    // Handle subtasks update (replace all)
    if (updates.subtasks) {
        await prisma.subtask.deleteMany({ where: { taskId: params.id }});
        data.subtasks = {
            create: updates.subtasks.map((st: any) => ({
                id: st.id,
                title: st.title,
                isCompleted: st.isCompleted,
            }))
        }
    }
    
    // Handle comments update (replace all)
    if (updates.comments) {
        await prisma.comment.deleteMany({ where: { taskId: params.id }});
        data.comments = {
            create: updates.comments.map((c: any) => ({
                id: c.id,
                contentEn: c.content.en,
                contentId: c.content.id,
                isPinned: c.isPinned,
                timestamp: new Date(c.timestamp),
                authorId: c.author.id,
            }))
        }
    }

    // Handle revisions (append only)
    if (updates.revisions) {
       const lastRevision = updates.revisions[updates.revisions.length - 1];
       if (lastRevision) {
           data.revisions = {
               create: {
                   id: lastRevision.id,
                   changeEn: lastRevision.change.en,
                   changeId: lastRevision.change.id,
                   timestamp: new Date(lastRevision.timestamp),
                   authorId: lastRevision.author.id,
               }
           }
       }
    }

    // Handle files update
    if (updates.files) {
        await prisma.file.deleteMany({ where: { taskId: params.id }});
        data.files = {
            create: updates.files.map((f: any) => ({
                id: f.id,
                name: f.name,
                type: f.type,
                url: f.url,
                size: f.size,
                note: f.note,
            }))
        }
    }


    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: data,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(`Failed to update task ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Add role-based check if needed

    try {
        await prisma.task.delete({
            where: { id: params.id },
        });
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`Failed to delete task ${params.id}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
