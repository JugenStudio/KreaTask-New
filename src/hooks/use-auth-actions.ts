'use client';

import { useSession } from 'next-auth/react';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useAuthActions() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const updateUserInFirestore = async (userId: string, data: { name?: string, email?: string }) => {
        const res = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to update profile in database.");
        }

        // Trigger session update to reflect changes
        await update();
    };
    
    const changeUserPassword = async (currentPassword: string, newPassword: string) => {
        // This is a placeholder. NextAuth with Credentials provider
        // does not have a built-in password change endpoint.
        // This would require a custom API route to verify the current password
        // and update the hashed password in the database.
        console.warn("Password change is not implemented in this demo.");
        // Mock success for UI purposes
        return Promise.resolve();
    };
    
    const uploadProfilePicture = async (file: File) => {
        // This is a placeholder for file upload logic.
        // In a real app, you would upload this to a service like S3,
        // get the URL, and then call updateUserInFirestore with the URL.
        console.warn("File upload is not implemented. Using a random placeholder.");
        const randomImageUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
        
        const res = await fetch(`/api/users/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: randomImageUrl }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to update profile picture in database.");
        }

        await update();
    };

    const logout = async () => {
        await signOut({ callbackUrl: '/landing' });
    };

    return {
        updateUserInFirestore,
        changeUserPassword,
        uploadProfilePicture,
        logout,
    };
}
