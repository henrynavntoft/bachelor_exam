"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Card from "./components/Card";
import LoadingSpinner from "./components/LoadingSpinner";
import Map from "./components/Map";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  images: string[];
  date: string;
  location: string;
  hostId: string;
  host: {
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  attendees: {
    userId: string;
    eventId: string;
  }[];
}

interface EventsResponse {
  events: Event[];
  nextCursor?: string;
}

export default function Home() {
  const [showMobileMap, setShowMobileMap] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<EventsResponse>({
    queryKey: ["events"],
    queryFn: async ({ pageParam = undefined }) => {
      const res = await axiosInstance.get(routes.events.all, {
        params: {
          limit: 6,
          cursor: pageParam
        },
        withCredentials: true
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });

  // Implement intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = loadMoreRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Flatten all events from all pages
  const allEvents = data?.pages.flatMap(page => page.events) || [];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <article className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events List */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:mb-0">
            <Button
              variant="outline"
              className="lg:hidden flex items-center gap-2"
              onClick={() => setShowMobileMap(true)}
            >
              <MapPin className="w-4 h-4" />
              View Map
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            {allEvents.map((event) => (
              <Card key={event.id} event={event} showAttendButton={false} />
            ))}
          </div>

          {/* Loading indicator for infinite scrolling */}
          <div
            ref={loadMoreRef}
            className="w-full py-8 flex justify-center"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                <span className="text-sm text-muted-foreground">Loading more events...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-sm text-muted-foreground">Scroll for more events</span>
            ) : allEvents.length > 0 ? (
              <span className="text-sm text-muted-foreground">No more events to load</span>
            ) : null}
          </div>
        </div>

        {/* Map - Hidden on mobile */}
        <div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
          <Map events={allEvents} />
        </div>
      </article>

      {/* Full-screen mobile map */}
      {showMobileMap && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowMobileMap(false)}
            >
              Close Map
            </Button>
          </div>
          <Map events={allEvents} />
        </div>
      )}
    </>
  );
}