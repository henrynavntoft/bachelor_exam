'use client';

import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/types/user';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { ProfileSection } from '@/app/(user)/components/ProfileSection';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import React from 'react';

interface ProfileFormData {
    firstName: string;
    lastName: string;
    profilePicture?: File | string | null;
}

interface UserProfileViewProps {
    children: React.ReactNode;
}

export function UserProfileView({ children }: UserProfileViewProps) {
    const { user, updateUserProfile, isLoading: authIsLoading } = useAuth();

    async function handleProfileSubmit(data: ProfileFormData) {
        if (!user) return;

        try {
            let profilePictureUrl = data.profilePicture;
            if (data.profilePicture instanceof File) {
                const fd = new FormData();
                fd.append('image', data.profilePicture);
                const uploadUrl = routes.upload.profile(user.id);
                const res = await axiosInstance.post(
                    uploadUrl,
                    fd,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                profilePictureUrl = res.data.url || res.data.location;
            }

            await axiosInstance.put(
                routes.users.update(user.id),
                { ...data, profilePicture: profilePictureUrl, email: user.email },
                { withCredentials: true }
            );

            updateUserProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                profilePicture: profilePictureUrl as string
            });

            toast.success("Profile updated successfully");
        } catch (err) {
            console.error('Update profile failed', err);
            toast.error("Failed to update profile");
        }
    }

    if (authIsLoading || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-10">
            <ProfileSection
                user={user as User}
                onUpdate={handleProfileSubmit}
                showEditButton={true}
            />
            {children}
        </div>
    );
} 