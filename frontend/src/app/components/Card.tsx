"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Card as UICard, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Event {
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    location: string;
    attendees?: Array<{
        userId: string;
        eventId: string;
    }>;
}

interface CardProps {
    event: Event;
}

export default function Card({ event }: CardProps) {
    const router = useRouter();
    const { isGuest, user } = useAuth();
    const queryClient = useQueryClient();

    // Check if user is attending this event
    const { data: isUserAttending } = useQuery({
        queryKey: ['attendance', event.id],
        queryFn: async () => {
            if (!user) return false;
            try {
                const res = await axiosInstance.get(routes.events.one(event.id), { withCredentials: true });
                const eventData = res.data;
                return eventData.attendees?.some((attendee: { userId: string; eventId: string }) => attendee.userId === user.id) || false;
            } catch (error) {
                console.error('Error checking attendance:', error);
                return false;
            }
        },
        enabled: !!user,
    });

    const handleClick = () => {
        router.push(`/events/${event.id}`);
    };

    const handleAttend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Please log in to attend events");
            return;
        }

        try {
            if (isUserAttending) {
                // Cancel attendance
                await axiosInstance.delete(routes.events.cancelAttend(event.id), { withCredentials: true });
                toast.success("Successfully canceled attendance");
            } else {
                // Attend event
                await axiosInstance.post(routes.events.attend(event.id), {}, { withCredentials: true });
                toast.success("Successfully RSVPed to event");
            }

            // Invalidate queries to refresh the data
            await queryClient.invalidateQueries({ queryKey: ['attendance', event.id] });
            await queryClient.invalidateQueries({ queryKey: ['events'] });
            await queryClient.invalidateQueries({ queryKey: ['rsvpedEvents'] });
        } catch (error) {
            console.error('Error updating attendance:', error);
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Please log in to attend events");
                } else {
                    toast.error(error.response?.data?.message || "Failed to update attendance");
                }
            } else {
                toast.error("Failed to update attendance");
            }
        }
    };

    return (
        <UICard
            className="cursor-pointer border hover:border-input transition-colors"
            onClick={handleClick}
        >
            <CardContent className="p-4">
                {event.images[0] && (
                    <div className="relative w-full h-48 mb-4">
                        <Image
                            src={event.images[0]}
                            alt={event.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                <p className="mb-2 line-clamp-2">{event.description}</p>
                <div className="text-sm mb-4">
                    <p>{format(new Date(event.date), 'MMM dd, yyyy')}</p>
                    <p>{event.location}</p>
                </div>
                {isGuest && (
                    <Button
                        className="w-full"
                        variant={isUserAttending ? "destructive" : "default"}
                        onClick={handleAttend}
                    >
                        {isUserAttending ? "Cancel Attendance" : "Attend Event"}
                    </Button>
                )}
            </CardContent>
        </UICard>
    );
}