'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { Star } from 'lucide-react';
import Image from 'next/image';
import { ClickableUserName } from '@/app/components/global/ClickableUserName';

interface AttendeeCardProps {
    userId: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    quantity?: number;
}

export function AttendeeCard({ userId, firstName, lastName, profilePicture, quantity }: AttendeeCardProps) {
    // Fetch attendee's average rating
    const { data: attendeeRating } = useQuery({
        queryKey: ['attendeeRating', userId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.averageRating(userId), { withCredentials: true });
            return res.data;
        },
        enabled: !!userId,
    });

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
                {profilePicture ? (
                    <Image
                        src={profilePicture}
                        alt={`${firstName} ${lastName}`}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-brand-foreground text-sm font-bold">
                        {firstName?.[0]}{lastName?.[0]}
                    </div>
                )}
            </div>

            {/* Attendee Info */}
            <div className="flex-1 min-w-0">
                <ClickableUserName
                    userId={userId}
                    firstName={firstName}
                    lastName={lastName}
                    className="font-medium text-sm"
                />
                
                {/* Rating Display */}
                {attendeeRating && attendeeRating.averageRating && (
                    <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-brand fill-current" />
                        <span className="text-xs text-muted-foreground">
                            {Number(attendeeRating.averageRating).toFixed(1)} ({attendeeRating.ratingCount})
                        </span>
                    </div>
                )}
                
                {/* No rating message */}
                {attendeeRating && !attendeeRating.averageRating && (
                    <span className="text-xs text-muted-foreground">No ratings yet</span>
                )}
            </div>

            {/* Quantity if more than 1 */}
            {quantity && quantity > 1 && (
                <div className="flex-shrink-0">
                    <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded-full">
                        +{quantity - 1}
                    </span>
                </div>
            )}
        </div>
    );
} 