"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./components/global/LoadingSpinner";
import Map from "./components/home/Map";
import EventGrid from "./components/home/EventGrid";
import MapToggle from "./components/home/MapToggle";
import MobileMap from "./components/home/MobileMap";
import InfiniteLoader from "./components/global/InfiniteLoader";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/lib/types/user";
import { Event } from "@/lib/types/event";

// Reusable error state component
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <p className="text-destructive mb-4">Error loading events</p>
    <Button variant="outline" onClick={onRetry}>
      Try again!
    </Button>
  </div>
);

// Main events section component
const EventsSection = ({ 
  events, 
  currentUser, 
  onShowMobileMap,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage 
}: {
  events: Event[];
  currentUser: User | null;
  onShowMobileMap: () => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}) => (
  <div>
    <div className="flex justify-between items-center mb-4 lg:mb-0">
      <MapToggle onShowMap={onShowMobileMap} />
    </div>

    <EventGrid events={events} currentUser={currentUser} />

    <InfiniteLoader
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      itemCount={events.length}
    />
  </div>
);

// Desktop map section component
const DesktopMapSection = ({ events }: { events: Event[] }) => (
  <div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
    <Map events={events} />
  </div>
);

export default function Home() {
  const [showMobileMap, setShowMobileMap] = useState(false);
  const { user: currentUser, isLoading: authIsLoading } = useAuth();
  const eventsQuery = useEvents(4);
  
  const {
    allEvents = [],
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error
  } = eventsQuery || {};

  // Consolidated loading state
  if (isLoading || authIsLoading) {
    return <LoadingSpinner />;
  }

  // Error state with retry functionality
  if (error) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  // Ensure events is always an array (single safety check)
  const safeEvents = Array.isArray(allEvents) ? allEvents : [];

  return (
    <>
      <article className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EventsSection
          events={safeEvents}
          currentUser={currentUser as User}
          onShowMobileMap={() => setShowMobileMap(true)}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
        
        <DesktopMapSection events={safeEvents} />
      </article>

      <MobileMap
        isVisible={showMobileMap}
        onClose={() => setShowMobileMap(false)}
        events={safeEvents}
      />
    </>
  );
}