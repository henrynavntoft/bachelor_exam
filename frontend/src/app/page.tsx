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

export default function Home() {
  const [showMobileMap, setShowMobileMap] = useState(false);

  const {
    allEvents,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error
  } = useEvents(6); // Fetch 6 events per page

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">Error loading events</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <article className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events List */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:mb-0">
            <MapToggle onShowMap={() => setShowMobileMap(true)} />
          </div>

          <EventGrid events={allEvents} />

          <InfiniteLoader
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            itemCount={allEvents.length}
          />
        </div>

        {/* Map - Hidden on mobile */}
        <div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
          <Map events={allEvents} />
        </div>
      </article>

      {/* Full-screen mobile map */}
      <MobileMap
        isVisible={showMobileMap}
        onClose={() => setShowMobileMap(false)}
        events={allEvents}
      />
    </>
  );
}