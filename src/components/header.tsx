'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  Download,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/providers/language-provider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { useCurrentUser } from "@/app/(app)/layout";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "next-auth/react";

export function Header() {
  const { currentUser } = useCurrentUser();
  const { t } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/tasks?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/tasks');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/landing' });
  };

  if (!currentUser) {
    return (
       <header className="sticky top-0 z-40 flex h-16 w-full items-center gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-lg">
        <Skeleton className="h-8 w-48" />
        <div className="ml-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center gap-4 border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-lg">
        {isMobile && (
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <Image src="/sounds/logo2.png" alt="KreaTask Logo" width={32} height={32} />
          </Link>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("header.search_placeholder")}
            className="w-full rounded-lg bg-secondary/50 pl-8 md:w-[200px] lg:w-[320px] text-foreground placeholder:text-muted-foreground border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Right section */}
        <div className="flex items-center gap-2 ml-auto">
          
          {/* Notification Center */}
          <NotificationCenter currentUser={currentUser} />
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={currentUser.avatarUrl ?? undefined}
                    alt={currentUser.name}
                  />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-popover backdrop-blur-xl"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                      {currentUser.name}
                      </p>
                      <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">{t(`roles.${currentUser.role}` as any)}</Badge>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>{t("header.profile")}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("header.settings")}</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/about">
                  <Info className="mr-2 h-4 w-4" />
                  <span>{t("header.about")}</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/downloads">
                  <Download className="mr-2 h-4 w-4" />
                  <span>{t("header.downloads")}</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsLogoutAlertOpen(true); }} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("header.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('header.logout_dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('header.logout_dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('header.logout_dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>{t('header.logout_dialog.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}