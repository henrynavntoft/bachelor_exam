import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { User } from '@/lib/types/user';
import { Attendee } from '@/lib/types/attendee';

export interface Event {
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    location: string;
    hostId: string;
    host: User;
    attendees: Attendee[];
}

interface EventsResponse {
    events: Event[];
    nextCursor?: string;
}

export function useEvents(limit = 6) {
    const query = useInfiniteQuery<EventsResponse>({
        queryKey: ["events"],
        queryFn: async ({ pageParam = undefined }) => {
            try {
                const res = await axiosInstance.get(routes.events.all, {
                    params: {
                        limit,
                        cursor: pageParam
                    },
                    withCredentials: true
                });

                // Safely handle different API response structures
                const responseData = res.data;

                // Check if the response has the expected structure
                if (responseData && typeof responseData === 'object') {
                    // Handle case where response is { events: [...] }
                    if (Array.isArray(responseData.events)) {
                        return {
                            events: responseData.events,
                            nextCursor: responseData.nextCursor
                        };
                    }

                    // Handle case where response is directly an array
                    if (Array.isArray(responseData)) {
                        return {
                            events: responseData,
                            nextCursor: undefined
                        };
                    }
                }

                // If we can't determine the structure, return empty events
                console.error('Unexpected API response structure:', responseData);
                return { events: [] };
            } catch (error) {
                console.error('Error fetching events:', error);
                return { events: [] };
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
    });

    // Flatten all events from all pages for easy consumption
    const allEvents = query.data?.pages?.flatMap(page => page.events || []) || [];

    return {
        ...query,
        allEvents
    };
} 