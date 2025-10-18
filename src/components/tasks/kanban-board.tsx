
"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskStatus } from "@/lib/types";
import { useLanguage } from "@/providers/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTaskData } from "@/hooks/use-task-data";

const statusColumns: TaskStatus[] = ["To-do", "In Progress", "In Review", "Completed", "Blocked"];

const statusColors: Record<TaskStatus, string> = {
  "To-do": "bg-gray-500",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  "Completed": "bg-green-500",
  "Blocked": "bg-red-500",
};

function KanbanTaskCard({ task }: { task: Task }) {
    const { locale } = useLanguage();
    const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
      } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className={cn(
                "card-spotlight bg-card hover:border-primary/50 transition-colors rounded-xl mb-3",
                isDragging && "shadow-lg scale-105"
            )}>
                <Link href={`/tasks/${task.id}`}>
                    <CardContent className="p-3">
                        <p className="text-sm font-semibold leading-tight mb-2 text-card-foreground break-words whitespace-normal">{task.title[locale]}</p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 whitespace-normal">{task.description[locale]}</p>

                        {totalSubtasks > 0 && (
                            <div className="text-xs text-muted-foreground mb-3">
                                {completedSubtasks} / {totalSubtasks} sub-tasks
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                            <div className="flex -space-x-2">
                            {task.assignees.map((user) => (
                                <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            </div>
                            <Badge variant="outline" className="text-xs">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Badge>
                        </div>
                    </CardContent>
                </Link>
            </Card>
        </div>
    );
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
    const { t } = useLanguage();
    const { setNodeRef } = useSortable({ id: status });

    return (
        <div ref={setNodeRef} className="w-full md:w-72 flex-shrink-0">
            <div className="h-full bg-secondary/50 rounded-xl md:rounded-2xl">
                <CardHeader className="p-3 flex-row justify-between items-center space-y-0">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", statusColors[status])} />
                        <CardTitle className="text-sm font-semibold whitespace-nowrap">
                            {t(`all_tasks.status.${status.toLowerCase().replace(' ', '_')}` as any, {defaultValue: status})}
                        </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
                </CardHeader>
                <CardContent className="p-1.5 pt-0 min-h-[100px]">
                    <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <KanbanTaskCard key={task.id} task={task} />
                        ))}
                    </SortableContext>
                </CardContent>
            </div>
        </div>
    );
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
    const { t } = useLanguage();
    const { updateTask } = useTaskData();
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: {
            distance: 8,
          },
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const tasksByStatus = useMemo(() => statusColumns.reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status)
                           .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return acc;
    }, {} as Record<TaskStatus, Task[]>), [tasks]);


    function handleDragStart(event: DragStartEvent) {
        if (event.active.data.current?.task) {
          setActiveTask(event.active.data.current.task);
        }
      }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);
    
        if (!over) return;
    
        const activeContainer = active.data.current?.sortable?.containerId;
        const overContainer = over.data.current?.sortable?.containerId || over.id;
    
        if (active.id !== over.id && activeContainer !== overContainer) {
          const newStatus = overContainer as TaskStatus;
          if (statusColumns.includes(newStatus)) {
            updateTask(active.id as string, { status: newStatus });
          }
        }
      }

    if (tasks.length === 0) {
      return (
          <div className="text-center p-10 rounded-xl md:rounded-2xl bg-secondary/50">
              <p className="font-bold text-sm md:text-base">{t('all_tasks.no_tasks_title', { defaultValue: 'No Tasks Found' })}</p>
              <p className="text-sm text-muted-foreground">{t('all_tasks.no_tasks_desc', { defaultValue: 'Try adjusting your search or filter.' })}</p>
          </div>
      )
  }

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
        <ScrollArea className="w-full rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 pb-4">
                <SortableContext items={statusColumns}>
                    {statusColumns.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={tasksByStatus[status]}
                        />
                    ))}
                </SortableContext>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <DragOverlay>
            {activeTask ? <KanbanTaskCard task={activeTask} /> : null}
        </DragOverlay>
    </DndContext>
  );
}
