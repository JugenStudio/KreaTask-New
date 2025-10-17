'use client';

import { useSession, signOut } from 'next-auth/react';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

export function useAuthActions() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const updateUserProfile = async (userId: string, data: { name?: string, email?: string, avatarUrl?: string }) => {
        const res = await fetch(`/api/users/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to update profile in database.");
        }

        // Trigger session update
        await update();
    };
    
    const updateUserEmail = async (newEmail: string) => {
        // This is a placeholder. In a real scenario, this would involve
        // a verification flow. For now, we just update the session.
        console.warn("Email update flow is not fully implemented. Updating session data only.");
        await update({ user: { email: newEmail } });
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
        // get the URL, and then call updateUserProfile with the URL.
        console.warn("File upload is not implemented. Using a random placeholder.");
        const randomImageUrl = `https://picsum.photos/seed/${Date.now()}/200/200`;
        await updateUserProfile((session?.user as any)?.id, { avatarUrl: randomImageUrl });
    };

    const logout = async () => {
        await signOut({ callbackUrl: '/landing' });
    };

    return {
        updateUserProfile,
        updateUserEmail,
        changeUserPassword,
        uploadProfilePicture,
        logout,
    };
}
