"use client";

import { useMemo, useCallback, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CommentSection } from "@/components/tasks/comment-section";
import { RevisionHistory } from "@/components/tasks/revision-history";
import { TaskDetails } from "@/components/tasks/task-details";
import { useTaskData } from "@/hooks/use-task-data";
import { notFound, useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/providers/language-provider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useCurrentUser } from "@/app/(app)/layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { Comment as CommentType, TaskStatus, Task } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";

const statusColors: Record<TaskStatus, string> = {
  "To-do": "bg-gray-500",
  "In Progress": "bg-blue-500",
  "In Review": "bg-yellow-500",
  Completed: "bg-green-500",
  Blocked: "bg-red-500",
};


export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { allTasks, users, isLoading, updateTask, addNotification, deleteTask, setAllTasks } = useTaskData();
  const { currentUser } = useCurrentUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  
  const task = useMemo(() => allTasks.find((t) => t.id === id), [id, allTasks]);
  
  const { t, locale } = useLanguage();

  const handleUpdateComments = useCallback((updatedComments: CommentType[]) => {
    if (task) {
        updateTask(task.id, { comments: updatedComments });
    }
  }, [task, updateTask]);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task) return;
    updateTask(task.id, { status: newStatus });
    toast({
      title: t('task.status_change_toast.title'),
      description: t('task.status_change_toast.description', { title: task.title[locale], status: t(`all_tasks.status.${newStatus.toLowerCase().replace(' ', '_')}`) }),
    });
  }

  if (isLoading || !currentUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-36" />
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Skeleton className="md:col-span-2 h-[600px]" />
            <Skeleton className="md:col-span-1 h-[400px]" />
        </div>
      </div>
    );
  }

  if (!task) {
    notFound();
  }

  return (
    <>
    <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('all_tasks.back_to_tasks')}
        </Button>

         <div className="flex justify-end items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('task.edit_modal.title')}
            </Button>
            <Select value={task.status} onValueChange={(value: TaskStatus) => handleStatusChange(value)}>
              <SelectTrigger className="w-fit min-w-[140px] text-xs md:text-sm font-semibold border-border bg-card hover:bg-muted focus:ring-ring gap-2">
                 <SelectValue>
                  <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[task.status])}></span>
                      {t(`all_tasks.status.${task.status.toLowerCase().replace(' ', '_')}` as any)}
                  </div>
                 </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(statusColors).map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[status as TaskStatus])}></span>
                      {t(`all_tasks.status.${status.toLowerCase().replace(' ', '_')}` as any)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-2">
            <TaskDetails 
              task={task} 
              onUpdateTask={updateTask} 
              onAddNotification={addNotification}
              onDeleteTask={deleteTask}
            />
        </div>
        <div className="md:col-span-1">
            <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comments">{t('task.tabs.comments')}</TabsTrigger>
                <TabsTrigger value="revisions">{t('task.tabs.history')}</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
                <CommentSection 
                    taskId={task.id}
                    comments={task.comments} 
                    currentUser={currentUser} 
                    onUpdateComments={handleUpdateComments}
                />
            </TabsContent>
            <TabsContent value="revisions" className="mt-4">
                <RevisionHistory revisions={task.revisions} />
            </TabsContent>
            </Tabs>
        </div>
        </div>
    </div>
     {task && (
        <EditTaskModal 
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            task={task}
        />
      )}
    </>
  );
}

    
