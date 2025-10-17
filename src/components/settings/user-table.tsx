"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { isEmployee, isDirector, isSuperAdmin } from "@/lib/roles";
import { Trash2 } from "lucide-react";
import { useLanguage } from "@/providers/language-provider";
import { Card, CardContent } from "../ui/card";
import { useTaskData } from "@/hooks/use-task-data";
import { Skeleton } from "../ui/skeleton";

const roles: UserRole[] = Object.values(UserRole);

interface UserTableProps {
  initialUsers: User[];
  currentUser: User;
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
}

export function UserTable({ initialUsers, currentUser, setUsers }: UserTableProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { updateUserInFirestore, deleteUser } = useTaskData();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const users = initialUsers;
  const isLoading = !users;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserInFirestore(userId, { role: newRole });
    const user = users?.find((u) => u.id === userId);
    toast({
      title: t("settings.user_management.toast.role_updated_title"),
      description: t("settings.user_management.toast.role_updated_desc", {
        name: user?.name || "",
        role: newRole,
      }),
    });
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    await deleteUser(userToDelete.id);

    toast({
      title: t("settings.user_management.toast.user_deleted_title"),
      description: t("settings.user_management.toast.user_deleted_desc", { name: userToDelete.name }),
    });
    setUserToDelete(null);
  };

  const canEditRole = (targetUser: User): boolean => {
    if (currentUser.id === targetUser.id) return false; // Cannot edit self
    if (isSuperAdmin(currentUser.role)) return true; // Super Admin can edit anyone
    if (currentUser.role === UserRole.DIREKTUR_UTAMA) {
        return targetUser.role !== UserRole.ADMIN;
    }
    if (isDirector(currentUser.role)) {
      return isEmployee(targetUser.role) || targetUser.role === UserRole.UNASSIGNED;
    }
    return false;
  };

  const canDeleteUser = (targetUser: User): boolean => {
     if (currentUser.id === targetUser.id) return false;
     if (isSuperAdmin(currentUser.role)) return true;
     if (currentUser.role === UserRole.DIREKTUR_UTAMA) {
        return targetUser.role !== UserRole.ADMIN;
     }
     if (isDirector(currentUser.role)) {
       return isEmployee(targetUser.role) || targetUser.role === UserRole.UNASSIGNED;
     }
     return false;
  }
  
  if (isLoading || !users) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      )
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block w-full overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.user_management.table.user")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("settings.user_management.table.email")}</TableHead>
              <TableHead>{t("settings.user_management.table.role")}</TableHead>
              <TableHead className="text-right">{t("settings.user_management.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                      <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{user.name}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value: UserRole) =>
                      handleRoleChange(user.id, value)
                    }
                    disabled={!canEditRole(user)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t("settings.user_management.table.select_role")} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(`roles.${role}`, { defaultValue: role })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  {canDeleteUser(user) && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} className="transition-all active:scale-95">
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="rounded-xl">
            <CardContent className="p-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                  disabled={!canEditRole(user)}
                >
                  <SelectTrigger className="flex-1 h-9 text-xs">
                    <SelectValue placeholder={t("settings.user_management.table.select_role")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {t(`roles.${role}`, { defaultValue: role })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canDeleteUser(user) && (
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} className="h-9 w-9 transition-all active:scale-95">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.user_management.delete_dialog.title', { name: userToDelete.name })}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('settings.user_management.delete_dialog.description')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="transition-all active:scale-95">{t('settings.user_management.delete_dialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 transition-all active:scale-95">
                        {t('settings.user_management.delete_dialog.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
