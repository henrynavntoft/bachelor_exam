"use client";

import { useQuery } from "@tanstack/react-query";
import Card from "./components/Card";
import LoadingSpinner from "./components/LoadingSpinner";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";

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
    <article>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card key={event.id} event={event} />
        ))}
      </div>
    </article>
  );
}