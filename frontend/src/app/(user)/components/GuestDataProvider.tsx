'use client';

import { useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { Attendee } from '@/lib/types/attendee';
import { useAuth } from '@/context/AuthContext';

// Define an extended Event type for rsvpedEvents that includes the quantity
export interface RsvpedEvent extends Event {
    currentUserRsvpQuantity?: number;
}

interface GuestDataProviderProps {
    children: (data: {
        currentUser: User | null;
        rsvpedEvents: RsvpedEvent[];
        isLoadingEvents: boolean;
    }) => ReactNode;
}

export function GuestDataProvider({ children }: GuestDataProviderProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: rsvpedEvents = [], isLoading: isLoadingEvents } = useQuery<RsvpedEvent[]>({
        queryKey: ["rsvpedEvents", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            const allEvents: Event[] = res.data.events || [];

            const userRsvpedEvents: RsvpedEvent[] = [];
            for (const event of allEvents) {
                const userAttendee = event.attendees?.find((attendee: Attendee) => attendee.userId === user.id);
                if (userAttendee) {
                    userRsvpedEvents.push({
                        ...event,
                        currentUserRsvpQuantity: userAttendee.quantity,
                    });
                }
            }
            return userRsvpedEvents;
        },
        enabled: !!user,
    });

    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            // A common pattern: if a mutation related to 'attendance' completes,
            // or if a query tagged with 'attendance' changes, refresh rsvpedEvents.
            // The original code checked for `queryClient.getQueryData(['attendance'])`.
            // This could mean that an attendance mutation updates a query with this key,
            // or it simply exists as a signal.

            // Let's simplify and assume any cache event *could* be relevant if not overly specific.
            // A more targeted approach involves checking event.type or specific queryKeys if available in `event`.
            // For now, to replicate the spirit of the original, if an 'attendance' related query changes state.
            if (event && event.query && event.query.queryKey[0] === 'attendance') {
                queryClient.invalidateQueries({ queryKey: ["rsvpedEvents", user?.id] });
            }
            // A more direct approach if you have an RSVP mutation:
            // Call invalidateQueries in the mutation's onSuccess.
            // This useEffect is more of a fallback or general cache sync.
        });
        return () => unsubscribe();
    }, [queryClient, user?.id]);

    // isLoadingEvents is handled by GuestDashboard, no need for a spinner here
    // if GuestDashboard is always rendered by this provider.

    return children({
        currentUser: user as User,
        rsvpedEvents,
        isLoadingEvents,
    });
} 