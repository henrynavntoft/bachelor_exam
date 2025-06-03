'use client';

import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/types/user';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { ProfileSection } from '@/app/(user)/components/ProfileSection';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, User as UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Rating, AverageRating } from '@/lib/types/rating';

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

    // Rating system data fetching using inline queries
    const { data: ratingsReceived, isLoading: isLoadingRatingsReceived } = useQuery<Rating[]>({
        queryKey: ['ratings', 'userRatingsReceived', user?.id],
        queryFn: async () => {
            const { data } = await axiosInstance.get(routes.users.ratings(user!.id));
            return data;
        },
        enabled: !!user,
    });

    const { data: averageRating, isLoading: isLoadingAverageRating } = useQuery<AverageRating>({
        queryKey: ['ratings', 'userAverageRating', user?.id],
        queryFn: async () => {
            const { data } = await axiosInstance.get(routes.users.averageRating(user!.id));
            return data;
        },
        enabled: !!user,
    });

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

            {/* Ratings Received Section */}
            <section className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 pt-4">
                            <Star className="h-5 w-5 text-brand" />
                            Ratings You&apos;ve Received
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAverageRating || isLoadingRatingsReceived ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="space-y-6 p-4">
                                {/* Average Rating Display */}
                                {averageRating && (
                                    <div className="bg-brand/10 rounded-lg p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Star className="h-6 w-6 text-brand fill-current" />
                                            <span className="text-2xl font-bold text-brand">
                                                {averageRating.averageRating?.toFixed(1) ?? 'N/A'}
                                            </span>
                                            <span className="text-lg text-muted-foreground">/10</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Based on {averageRating.ratingCount} rating{averageRating.ratingCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}

                                {/* Individual Ratings */}
                                {ratingsReceived && ratingsReceived.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg border-b pb-2">Individual Ratings</h4>
                                        <div className="grid gap-4">
                                            {ratingsReceived.map(rating => (
                                                <div key={rating.id} className="bg-muted/20 rounded-lg p-4 border border-border hover:shadow-sm transition-shadow">
                                                    <div className="flex items-start justify-between mb-3">
                                                        {/* Rating Score */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 bg-brand/10 px-3 py-1 rounded-full">
                                                                <Star className="h-4 w-4 text-brand fill-current" />
                                                                <span className="font-bold text-brand">{rating.rating}/10</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Event & Date */}
                                                        <div className="text-right">
                                                            <div className="font-medium text-sm">{rating.event?.title || 'Event'}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {rating.event?.date ? new Date(rating.event.date).toLocaleDateString() : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Rater Info */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            {rating.raterUser?.firstName ?? 'Anonymous'} {rating.raterUser?.lastName ?? ''}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Comment */}
                                                    {rating.comment && (
                                                        <div className="bg-background border border-border rounded-md p-3">
                                                            <p className="text-sm leading-relaxed italic">&quot;{rating.comment}&quot;</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No ratings received yet.</p>
                                        <p className="text-sm text-muted-foreground mt-1">Ratings will appear here after attending events.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>

            {children}
        </div>
    );
} 