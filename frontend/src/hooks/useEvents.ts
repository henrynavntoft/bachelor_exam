import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { Event } from '@/lib/types/event';

interface EventsResponse {
    events: Event[];
    nextCursor?: string;
}

export function useEvents(limit = 6) {
    const query = useInfiniteQuery<EventsResponse>({
        queryKey: ["events"],
        queryFn: async ({ pageParam }) => {
            const res = await axiosInstance.get(routes.events.all, {
                params: pageParam ? { limit, cursor: pageParam } : { limit },
                withCredentials: true
            });
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes - events don't change very frequently
        gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache
        refetchOnWindowFocus: false, // Don't refetch on every window focus
    });

    const allEvents = query.data?.pages.flatMap(page => page.events) ?? [];

    return {
        ...query,
        allEvents
    };
} 