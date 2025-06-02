'use client';

import { useState } from 'react';
import { Mail, KeyRound, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types/user';
import { ProfileForm } from '@/app/(user)/components/ProfileForm';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { UserProfileHeader } from './UserProfileHeader';

interface ProfileSectionProps {
    user: User;
    onUpdate?: (data: { firstName: string; lastName: string; profilePicture?: File | string | null }) => Promise<void>;
    showEditButton?: boolean;
}

export function ProfileSection({
    user,
    onUpdate,
    showEditButton = true
}: ProfileSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { logout } = useAuth();

    const handleProfileSubmit = async (data: { firstName: string; lastName: string; profilePicture?: File | string | null }) => {
        if (onUpdate) {
            await onUpdate(data);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleResetPassword = async () => {
        try {
            setIsSubmitting(true);
            await axiosInstance.post(routes.auth.forgotPassword, { email: user.email });

            // Close the dialog
            setIsResettingPassword(false);

            // Show success message
            toast.success('Password reset email sent. Please check your inbox.');

            // Log the user out
            await logout();
        } catch (error) {
            console.error('Error sending password reset email:', error);
            toast.error('Failed to send password reset email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
                <UserProfileHeader user={user} avatarSize="lg" subtitleField="role" />

                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {showEditButton && onUpdate && (
                            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="mt-2">
                                        Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Profile</DialogTitle>
                                        <DialogDescription>
                                            Update your profile information
                                        </DialogDescription>
                                    </DialogHeader>

                                    <ProfileForm
                                        initialData={{
                                            firstName: user.firstName,
                                            lastName: user.lastName,
                                            profilePicture: user.profilePicture || undefined
                                        }}
                                        onSubmit={handleProfileSubmit}
                                        onCancel={handleCancel}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}

                        <Dialog open={isResettingPassword} onOpenChange={setIsResettingPassword}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="mt-2" size="default">
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Reset Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                        Reset Your Password
                                    </DialogTitle>
                                    <DialogDescription>
                                        We&apos;ll send a password reset link to your email address ({user.email}).
                                        You will be logged out immediately and will need to click the link in your email to set a new password.
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleResetPassword}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </section>
    );
} 