'use client';

import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
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
        upcomingEvents: RsvpedEvent[];
        pastEvents: RsvpedEvent[];
        isLoadingEvents: boolean;
    }) => ReactNode;
}

export function GuestDataProvider({ children }: GuestDataProviderProps) {
    const { user } = useAuth();

    const { data: eventsData = { upcomingEvents: [], pastEvents: [] }, isLoading: isLoadingEvents } = useQuery<{ upcomingEvents: RsvpedEvent[], pastEvents: RsvpedEvent[] }>({
        queryKey: ["rsvped-events", user?.id],
        queryFn: async () => {
            if (!user) return { upcomingEvents: [], pastEvents: [] };
            
            const res = await axiosInstance.get(`${routes.events.all}?includePast=true`, { withCredentials: true });
            const allEvents: Event[] = res.data.events || [];

            const userRsvpedEvents: RsvpedEvent[] = allEvents
                .filter(event => event.attendees?.some((attendee: Attendee) => attendee.userId === user.id))
                .map(event => ({
                    ...event,
                    currentUserRsvpQuantity: event.attendees?.find((attendee: Attendee) => attendee.userId === user.id)?.quantity,
                }));

            const now = new Date();
            const upcomingEvents = userRsvpedEvents.filter(event => new Date(event.date) >= now);
            const pastEvents = userRsvpedEvents.filter(event => new Date(event.date) < now);

            return { upcomingEvents, pastEvents };
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
    });

    return children({
        currentUser: user as User,
        upcomingEvents: eventsData.upcomingEvents,
        pastEvents: eventsData.pastEvents,
        isLoadingEvents,
    });
} 