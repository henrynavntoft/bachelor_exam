import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { User } from '@/lib/types/user';
import { Attendee } from '@/lib/types/attendee';
import { EventImage } from '@/lib/types/event';

export interface Event {
    id: string;
    title: string;
    description: string;
    images: EventImage[];
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
        queryFn: async ({ pageParam }) => {
            try {
                const res = await axiosInstance.get(routes.events.all, {
                    params: pageParam ? { limit, cursor: pageParam } : { limit },
                    withCredentials: true
                });

                const responseData = res.data;

                // Handle different response structures safely
                if (responseData && Array.isArray(responseData.events)) {
                    return {
                        events: responseData.events,
                        nextCursor: responseData.nextCursor
                    };
                }

                if (Array.isArray(responseData)) {
                    return {
                        events: responseData,
                        nextCursor: undefined
                    };
                }

                // Fallback for unexpected structure
                return { events: [], nextCursor: undefined };
            } catch (error) {
                console.error('Error fetching events:', error);
                return { events: [], nextCursor: undefined };
            }
        },
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        initialPageParam: undefined,
        
        // Caching configuration
        staleTime: 3 * 60 * 1000,     // 3 minutes - events don't change super frequently
        gcTime: 15 * 60 * 1000,       // 15 minutes - keep events in cache longer since they're commonly accessed
        
        // Additional optimizations
        refetchOnWindowFocus: false,   // Don't refetch when user switches browser tabs
        retry: 1,                      // Only retry once on failure
    });

    // Safely extract all events
    const allEvents = query.data?.pages?.reduce<Event[]>((acc, page) => {
        if (page?.events && Array.isArray(page.events)) {
            return [...acc, ...page.events];
        }
        return acc;
    }, []) ?? [];

    return {
        ...query,
        allEvents
    };
} 