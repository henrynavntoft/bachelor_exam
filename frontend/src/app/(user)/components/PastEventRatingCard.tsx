'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { EventCard } from '@/app/(event)/components/EventCard';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { Rating } from '@/lib/types/rating';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import { RateUserModal } from './RateUserModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';

// Define types locally to match usage in the component
interface Attendee {
    id: string;
    firstName?: string;
    lastName?: string;
    isHost?: boolean;
}

interface SubmitRatingPayload {
    ratedUserId: string;
    rating: number;
    comment?: string;
    eventId: string;
    raterUserId?: string;
}

interface PastEventCardProps {
    event: Event;
    currentUser: User;
    onEdit?: (event: Event) => void;
    onDelete?: (id: string) => void;
}

export function PastEventCard({ event, currentUser, onEdit, onDelete }: PastEventCardProps) {
    const [isRatingExpanded, setIsRatingExpanded] = useState(false);
    const [showRateModal, setShowRateModal] = useState(false);
    const [selectedAttendeeToRate, setSelectedAttendeeToRate] = useState<Attendee | null>(null);
    const queryClient = useQueryClient();

    // Inline queries following your existing pattern
    const { data: attendees, isLoading: isLoadingAttendees } = useQuery<Attendee[]>({
        queryKey: ['ratings', 'eventAttendees', event.id],
        queryFn: async () => {
            const { data } = await axiosInstance.get(routes.events.attendees(event.id));
            return data;
        },
        enabled: !!event.id,
    });

    const { data: ratingsGivenByLoggedInUser, isLoading: isLoadingRatingsGiven } = useQuery<Rating[]>({
        queryKey: ['ratings', 'userRatingsGiven', currentUser.id],
        queryFn: async () => {
            const { data } = await axiosInstance.get(routes.users.ratingsGiven(currentUser.id));
            return data;
        },
        enabled: !!currentUser,
    });

    const submitRatingMutation = useMutation<Rating, Error, SubmitRatingPayload>({
        mutationFn: async (payload) => {
            const { data } = await axiosInstance.post(routes.users.ratings(payload.ratedUserId), payload);
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries to update the UI
            queryClient.invalidateQueries({ queryKey: ['ratings', 'userRatingsReceived', variables.ratedUserId] });
            queryClient.invalidateQueries({ queryKey: ['ratings', 'userAverageRating', variables.ratedUserId] });
            
            if (variables.raterUserId) {
                queryClient.invalidateQueries({ queryKey: ['ratings', 'userRatingsGiven', variables.raterUserId] });
                queryClient.invalidateQueries({ queryKey: ["rsvpedEvents", variables.raterUserId] });
            }

            queryClient.invalidateQueries({ queryKey: ['ratings', 'eventAttendees', variables.eventId] });
        },
    });

    const getExistingRating = (attendeeId: string) => {
        if (!ratingsGivenByLoggedInUser) return null;
        return ratingsGivenByLoggedInUser.find(
            (rating) => rating.ratedUserId === attendeeId && rating.event?.id === event.id
        );
    };

    const handleOpenRateModal = (attendee: Attendee) => {
        setSelectedAttendeeToRate(attendee);
        setShowRateModal(true);
    };

    const handleCloseRateModal = () => {
        setShowRateModal(false);
        setSelectedAttendeeToRate(null);
    };

    const handleRateSubmit = async (values: { rating: number; comment?: string }) => {
        if (!selectedAttendeeToRate) return;
        
        submitRatingMutation.mutate(
            { 
                ...values, 
                ratedUserId: selectedAttendeeToRate.id, 
                eventId: event.id,
                raterUserId: currentUser.id
            },
            {
                onSuccess: () => {
                    toast.success(`Successfully rated ${selectedAttendeeToRate.firstName}`);
                    handleCloseRateModal();
                },
                onError: (error: Error) => {
                    toast.error(error.message || 'Failed to submit rating');
                },
            }
        );
    };

    // Get attendees that can be rated (exclude current user)
    const rateableAttendees = attendees?.filter(attendee => attendee.id !== currentUser.id) || [];
    const hasUnratedAttendees = rateableAttendees.some(attendee => !getExistingRating(attendee.id));

    return (
        <div className="space-y-2">
            {/* Regular Event Card */}
            <EventCard
                event={event}
                currentUser={currentUser}
                onEdit={onEdit}
                onDelete={onDelete}
                isPastEvent={true}
                showAttendControls={false}
            />

            {/* Rating Section - Only show if there are attendees to rate */}
            {rateableAttendees.length > 0 && (
                <div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-brand/20 hover:bg-brand/5"
                        disabled={isLoadingAttendees || isLoadingRatingsGiven}
                        onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                    >
                        <Star className="mr-2 h-4 w-4" />
                        Rate Participants
                        {hasUnratedAttendees && (
                            <span className="ml-2 bg-brand text-white text-xs px-2 py-1 rounded-full">
                                New
                            </span>
                        )}
                        {isRatingExpanded ? (
                            <ChevronUp className="ml-auto h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-auto h-4 w-4" />
                        )}
                    </Button>
                    
                    {isRatingExpanded && (
                        <div className="mt-3">
                            {isLoadingAttendees || isLoadingRatingsGiven ? (
                                <LoadingSpinner />
                            ) : (
                                <div className="bg-muted/30 border border-brand/10 rounded-lg p-4 space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Event Participants</h4>
                                    {rateableAttendees.map(attendee => {
                                        const existingRating = getExistingRating(attendee.id);

                                        return (
                                            <div key={attendee.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-md text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{attendee.firstName} {attendee.lastName}</span>
                                                    {attendee.isHost && (
                                                        <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded">Host</span>
                                                    )}
                                                </div>
                                                {existingRating ? (
                                                    <div className="flex items-center gap-1 text-brand font-medium">
                                                        <Star className="h-3 w-3 fill-current" />
                                                        {existingRating.rating}/10
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleOpenRateModal(attendee)}
                                                        size="sm"
                                                        className="bg-brand hover:bg-brand/90 text-xs px-3 py-1 h-auto"
                                                        disabled={submitRatingMutation.isPending}
                                                    >
                                                        Rate
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {rateableAttendees.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No other participants to rate.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Rating Modal */}
            {selectedAttendeeToRate && (
                <RateUserModal
                    isOpen={showRateModal}
                    onClose={handleCloseRateModal}
                    attendeeName={`${selectedAttendeeToRate.firstName || ''} ${selectedAttendeeToRate.lastName || ''}`.trim() || 'Attendee'}
                    onSubmit={handleRateSubmit}
                    isLoading={submitRatingMutation.isPending}
                />
            )}
        </div>
    );
} 