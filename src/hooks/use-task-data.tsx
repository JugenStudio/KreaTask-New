'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import type { Task, User, LeaderboardEntry, Notification, UserRole } from '@/lib/types';
import { isEmployee } from '@/lib/roles';
import { useAuth, useUser } from '@stackframe/stack';
import { useQuery } from '@/hooks/use-query';
import { useToast } from '@/hooks/use-toast';

type DownloadItem = {
  id: number;
  fileName: string;
  taskName: string;
  date: string;
  url: string;
  size: string;
  status: 'Completed' | 'In Progress' | 'Failed';
  progress: number;
};

const calculateLeaderboard = (tasks: Task[], users: User[]): LeaderboardEntry[] => {
    if (!tasks || !users) return [];
    
    const teamMembers = users.filter(user => isEmployee(user.role));
    if (teamMembers.length === 0) return [];

    const userScores: { [key: string]: { id: string; name: string; score: number; tasksCompleted: number; avatarUrl: string | null; role: UserRole; jabatan?: string; } } = {};

    teamMembers.forEach(user => {
      userScores[user.id] = { id: user.id, name: user.name, score: 0, tasksCompleted: 0, avatarUrl: user.avatarUrl, role: user.role, jabatan: user.jabatan };
    });

    tasks.forEach(task => {
      if (task.status === 'Completed' && task.approvedBy) {
        task.assignees.forEach(assignee => {
          if (assignee && userScores[assignee.id]) {
            userScores[assignee.id].score += task.value;
            userScores[assignee.id].tasksCompleted += 1;
          }
        });
      }
    });

    const sortedUsers = Object.values(userScores).sort((a, b) => b.score - a.score);

    return sortedUsers.map((data, index) => ({
      ...data,
      rank: index + 1,
      avatarUrl: data.avatarUrl || '',
    }));
};

export interface TaskDataContextType {
    isLoading: boolean;
    allTasks: Task[];
    setAllTasks: (tasks: Task[] | ((prevTasks: Task[]) => Task[])) => void;
    users: User[];
    setUsers: (users: User[] | ((prevUsers: User[]) => User[])) => void;
    currentUserData: User | null;
    leaderboardData: LeaderboardEntry[];
    notifications: Notification[];
    setNotifications: (notifications: Notification[] | ((prev: Notification[]) => Notification[])) => void;
    downloadHistory: DownloadItem[];
    setDownloadHistory: (history: DownloadItem[] | ((prevState: DownloadItem[]) => DownloadItem[])) => void;
    addTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    addNotification: (notification: Partial<Notification>) => Promise<void>;
    updateNotifications: (notificationsToUpdate: {id: string, read: boolean}[]) => Promise<void>;
    updateUserInFirestore: (userId: string, data: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addToDownloadHistory: (file: { name: string; size: string, url: string }, taskName: string, isRedownload?: boolean) => void;
}

export const TaskDataContext = createContext<TaskDataContextType | undefined>(undefined);

export function TaskDataProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const userHook = useUser();
    const { toast } = useToast();
    
    // Stack's useUser hook provides the basic user object.
    // We fetch our extended user profile from our own API.
    const { data: currentUserDataFromDB, isLoading: isCurrentUserLoading, refetch: refetchCurrentUser } = useQuery<User>(
        '/api/users/me', { enabled: auth.authenticated }
    );
    
    const shouldFetchAllUsers = auth.authenticated && currentUserDataFromDB && !isEmployee(currentUserDataFromDB.role);
    const { data: allUsersFromDB, isLoading: isAllUsersLoading, refetch: refetchAllUsers } = useQuery<User[]>(
        '/api/users', { enabled: shouldFetchAllUsers }
    );
    
    const { data: tasksData, isLoading: isTasksLoading, refetch: refetchTasks } = useQuery<Task[]>(
        '/api/tasks', { enabled: auth.authenticated }
    );

    const { data: notificationsData, isLoading: isNotifsLoading, refetch: refetchNotifications } = useQuery<Notification[]>(
        '/api/notifications', { enabled: auth.authenticated }
    );
    
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
    
    const currentUserData = currentUserDataFromDB;

    // Populate state from query hooks
    useEffect(() => { if (tasksData) setAllTasks(tasksData) }, [tasksData]);
    useEffect(() => { if (notificationsData) setNotifications(notificationsData) }, [notificationsData]);

    useEffect(() => {
        const userMap = new Map<string, User>();
        if (currentUserData) userMap.set(currentUserData.id, currentUserData);
        if (allUsersFromDB) allUsersFromDB.forEach(user => userMap.set(user.id, user));
        setUsers(Array.from(userMap.values()));
    }, [currentUserData, allUsersFromDB]);
    
    useEffect(() => {
        if (currentUserData?.id) {
          try {
            const savedDownloads = localStorage.getItem(`kreatask_downloads_${currentUserData.id}`);
            setDownloadHistory(savedDownloads ? JSON.parse(savedDownloads) : []);
          } catch (error) { console.error("Failed to load downloads:", error); }
        }
    }, [currentUserData?.id]);

    useEffect(() => {
      if (currentUserData?.id) {
        localStorage.setItem(`kreatask_downloads_${currentUserData.id}`, JSON.stringify(downloadHistory));
      }
    }, [downloadHistory, currentUserData?.id]);

    const leaderboardData = useMemo(() => calculateLeaderboard(allTasks, users), [allTasks, users]);
    
    const mutation = async (url: string, method: string, body: any) => {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Mutation failed');
        }
        return response.json().catch(() => ({})); // Handle empty responses
    };

    const addTask = async (newTaskData: Partial<Task>) => {
        await mutation('/api/tasks', 'POST', newTaskData);
        refetchTasks();
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } as Task : t));
        try {
            await mutation(`/api/tasks/${taskId}`, 'PATCH', updates);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Update failed", description: "Could not save changes to the server."});
            refetchTasks(); 
        }
    };

    const deleteTask = async (taskId: string) => {
        setAllTasks(prev => prev.filter(t => t.id !== taskId));
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    };

    const addNotification = async (newNotificationData: Partial<Notification>) => {
        await mutation('/api/notifications', 'POST', newNotificationData);
        refetchNotifications();
    };
    
    const updateNotifications = async (notificationsToUpdate: {id: string, read: boolean}[]) => {
        setNotifications(prev => prev.map(n => {
            const update = notificationsToUpdate.find(u => u.id === n.id);
            return update ? { ...n, read: update.read } : n;
        }));
        await mutation('/api/notifications', 'PATCH', notificationsToUpdate);
    };

    const updateUserInFirestore = async (userId: string, data: Partial<User>) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } as User : u));
        await mutation(`/api/users/${userId}`, 'PATCH', data);
        refetchCurrentUser();
        refetchAllUsers();
        userHook.mutate();
    };

    const deleteUser = async (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    };

    const addToDownloadHistory = useCallback((file: { name: string; size: string, url: string }, taskName: string, isRedownload = false) => {
      const newDownloadItem: DownloadItem = {
        id: Date.now(),
        fileName: file.name, taskName, date: new Date().toISOString(), size: file.size, url: file.url,
        status: 'In Progress', progress: 0,
      };
      
      setDownloadHistory(prevHistory => {
        const existingItemIndex = prevHistory.findIndex(item => item.fileName === file.name && item.taskName === taskName);
        if (isRedownload && existingItemIndex > -1) {
            const updatedHistory = [...prevHistory];
            updatedHistory[existingItemIndex] = newDownloadItem;
            return updatedHistory;
        }
        return [newDownloadItem, ...prevHistory];
      });
    }, []);

    const value: TaskDataContextType = useMemo(() => ({
        isLoading: auth.loading || userHook.loading || isCurrentUserLoading || isTasksLoading || isNotifsLoading || isAllUsersLoading,
        allTasks, setAllTasks, users, setUsers, currentUserData, leaderboardData, notifications, setNotifications,
        downloadHistory, setDownloadHistory, addTask, updateTask, deleteTask, addNotification, updateNotifications,
        updateUserInFirestore, deleteUser, addToDownloadHistory,
    }), [
        auth.loading, userHook.loading, isCurrentUserLoading, isTasksLoading, isNotifsLoading, isAllUsersLoading,
        allTasks, users, currentUserData, leaderboardData, notifications, 
        downloadHistory, addToDownloadHistory, deleteTask, addNotification, updateNotifications, updateUserInFirestore, deleteUser, addTask, updateTask
    ]);

    return (
        <TaskDataContext.Provider value={value}>
            {children}
        </TaskDataContext.Provider>
    );
}

export const useTaskData = () => {
    const context = useContext(TaskDataContext);
    if (context === undefined) {
        throw new Error('useTaskData must be used within a TaskDataProvider');
    }
    return context;
};
