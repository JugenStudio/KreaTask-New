'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from 'next/navigation';
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/bottom-nav";
import { TaskDataProvider, useTaskData } from "@/hooks/use-task-data";
import { useSpotlightEffect } from "@/hooks/use-spotlight";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/providers/auth-provider";

// The context now holds the full User object from our database
const UserContext = createContext<{ currentUser: User | null }>({
  currentUser: null,
});

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentUserData, isLoading: isTaskDataLoading } = useTaskData();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  useSpotlightEffect();
  
  const currentUser = currentUserData;
  const { status } = useSession();


  if (pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/landing')) {
      return <>{children}</>
  }
  
  const isLoading = status === 'loading' || isTaskDataLoading;

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
      <UserContext.Provider value={{ currentUser }}>
        <div className={cn("min-h-screen w-full bg-background")}>
          <div className="flex min-h-screen w-full">
            {!isMobile && currentUser && <AppSidebar user={currentUser} />}
            <div className="flex flex-1 flex-col bg-transparent">
              {currentUser && <Header />}
              <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
                {children}
              </main>
            </div>
          </div>
          {isMobile && currentUser && <BottomNav />}
        </div>
      </UserContext.Provider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // The structure is simplified as Firebase providers are no longer needed.
  return (
    <AuthProvider>
        <LanguageProvider>
          <TaskDataProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
          </TaskDataProvider>
        </LanguageProvider>
    </AuthProvider>
  );
}

// Custom hook to use the UserContext
export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a AppLayout');
  }
  return context;
};
