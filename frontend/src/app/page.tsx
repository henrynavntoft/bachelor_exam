"use client";

import { useQuery } from "@tanstack/react-query";
import Card from "./components/Card";
import LoadingSpinner from "./components/LoadingSpinner";
import Map from "./components/Map";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
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

export default function Home() {
  const [showMobileMap, setShowMobileMap] = useState(false);
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  return (
    <>
      <article className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[#1A6258]">Upcoming Events</h2>
            <Button
              variant="outline"
              className="lg:hidden flex items-center gap-2"
              onClick={() => setShowMobileMap(true)}
            >
              <MapPin className="w-4 h-4" />
              View Map
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Card key={event.id} event={event} />
            ))}
          </div>
        </div>

        {/* Map - Hidden on mobile */}
        <div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)]">
          <Map events={events} />
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
          <Map events={events} />
        </div>
      )}
    </>
  );
}