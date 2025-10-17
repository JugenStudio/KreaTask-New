'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import type { Task, User, LeaderboardEntry, Notification } from '@/lib/types';
import { UserRole } from '@/lib/types';
import { isEmployee } from '@/lib/roles';
import { useSession } from 'next-auth/react';
import { useQuery } from '@/hooks/use-query';

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

    const userScores: { [key: string]: { name: string; score: number; tasksCompleted: number; avatarUrl: string | null; role: any; jabatan?: string; } } = {};

    teamMembers.forEach(user => {
      userScores[user.id] = { name: user.name, score: 0, tasksCompleted: 0, avatarUrl: user.avatarUrl, role: user.role, jabatan: user.jabatan };
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

    const sortedUsers = Object.entries(userScores).sort(([, a], [, b]) => b.score - a.score);

    return sortedUsers.map(([id, data], index) => ({
      id,
      rank: index + 1,
      name: data.name,
      score: data.score,
      tasksCompleted: data.tasksCompleted,
      avatarUrl: data.avatarUrl || '',
      role: data.role,
      jabatan: data.jabatan,
    }));
};

export interface TaskDataContextType {
    isLoading: boolean;
    allTasks: Task[];
    users: User[];
    currentUserData: User | null;
    leaderboardData: LeaderboardEntry[];
    notifications: Notification[];
    setNotifications: (notifications: Notification[] | ((prev: Notification[]) => Notification[])) => void;
    updateNotifications: (notificationsToUpdate: Notification[]) => Promise<void>;
    downloadHistory: DownloadItem[];
    setDownloadHistory: (history: DownloadItem[] | ((prevState: DownloadItem[]) => DownloadItem[])) => void;
    addTask: (task: Partial<Task>) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    addNotification: (notification: Partial<Notification>) => Promise<void>;
    updateUserInFirestore: (userId: string, data: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addToDownloadHistory: (file: { name: string; size: string, url: string }, taskName: string, isRedownload?: boolean) => void;
    setAllTasks: (tasks: Task[]) => void;
    setUsers: (users: User[]) => void;
}

export const TaskDataContext = createContext<TaskDataContextType | undefined>(undefined);

export function TaskDataProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    
    const { data: currentUserData, isLoading: isCurrentUserLoading } = useQuery<User>(
        '/api/users/me',
        { enabled: status === 'authenticated' }
    );
    
    const { data: allUsersFromDB, isLoading: isAllUsersLoading } = useQuery<User[]>(
        '/api/users',
        { enabled: status === 'authenticated' && !!currentUserData && !isEmployee(currentUserData.role) }
    );

    const users = useMemo(() => {
        const userMap = new Map<string, User>();
        if (currentUserData) {
            userMap.set(currentUserData.id, currentUserData);
        }
        if (allUsersFromDB) {
            allUsersFromDB.forEach(user => userMap.set(user.id, user));
        }
        return Array.from(userMap.values());
    }, [allUsersFromDB, currentUserData]);

    const { data: tasksData, isLoading: isTasksDataLoading } = useQuery<Task[]>(
        '/api/tasks',
        { enabled: status === 'authenticated' }
    );
    const allTasks = useMemo(() => tasksData || [], [tasksData]);
    
    const { data: notificationsDataFromDB, isLoading: isNotifsLoading } = useQuery<Notification[]>(
        '/api/notifications',
        { enabled: status === 'authenticated' }
    );
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (notificationsDataFromDB) {
            setNotifications(notificationsDataFromDB);
        }
    }, [notificationsDataFromDB]);

    const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
    
    useEffect(() => {
        if (currentUserData?.id) {
          try {
            const savedDownloads = localStorage.getItem(`kreatask_downloads_${currentUserData.id}`);
            if (savedDownloads) {
                setDownloadHistory(JSON.parse(savedDownloads));
            } else {
                setDownloadHistory([]);
            }
          } catch (error) {
              console.error("Failed to load downloads from localStorage:", error);
          }
        }
    }, [currentUserData?.id]);

    useEffect(() => {
      if (currentUserData?.id) {
        localStorage.setItem(`kreatask_downloads_${currentUserData.id}`, JSON.stringify(downloadHistory));
      }
    }, [downloadHistory, currentUserData?.id]);

    const leaderboardData = useMemo(() => calculateLeaderboard(allTasks, users), [allTasks, users]);
    
    // TODO: Implement API calls for mutations
    const addTask = async (newTaskData: Partial<Task>) => { console.log("addTask not implemented"); };
    const updateTask = async (taskId: string, updates: Partial<Task>) => { console.log("updateTask not implemented"); };
    const deleteTask = async (taskId: string) => { console.log("deleteTask not implemented"); };
    const updateUserInFirestore = async (userId: string, data: Partial<User>) => { console.log("updateUserInFirestore not implemented"); };
    const deleteUser = async (userId: string) => { console.log("deleteUser not implemented"); };
    const addNotification = async (newNotificationData: Partial<Notification>) => { console.log("addNotification not implemented"); };
    const updateNotifications = async (notificationsToUpdate: Notification[]) => { console.log("updateNotifications not implemented"); };
    const setAllTasks = (newTasks: Task[]) => { console.warn("setAllTasks is a no-op with a real backend."); };
    const setUsers = (newUsers: User[]) => { console.warn("setUsers is a no-op with a real backend."); };

    const addToDownloadHistory = useCallback((file: { name: string; size: string, url: string }, taskName: string, isRedownload = false) => {
      const newDownloadItem: DownloadItem = {
        id: Date.now(),
        fileName: file.name,
        taskName: taskName,
        date: new Date().toISOString(),
        size: file.size,
        url: file.url,
        status: 'In Progress',
        progress: 0,
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
        isLoading: status === 'loading' || isCurrentUserLoading || isTasksDataLoading || isNotifsLoading,
        allTasks,
        users,
        currentUserData,
        leaderboardData,
        notifications,
        setNotifications,
        updateNotifications,
        downloadHistory,
        setDownloadHistory,
        addTask,
        updateTask,
        deleteTask,
        addNotification,
        updateUserInFirestore,
        deleteUser,
        addToDownloadHistory,
        setAllTasks,
        setUsers,
    }), [
        status, isCurrentUserLoading, isTasksDataLoading, isNotifsLoading,
        allTasks, users, currentUserData, leaderboardData, notifications, 
        downloadHistory, addToDownloadHistory
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