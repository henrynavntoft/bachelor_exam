"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Card as EventCard, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Calendar } from "lucide-react";

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
    showAttendButton?: boolean; // Optional prop to show/hide attend button
}

export default function Card({ event, showAttendButton = false }: CardProps) {
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
        <EventCard
            className="cursor-pointer border-0 p-0"
            onClick={handleClick}
        >
            <CardContent className="p-0">
                {event?.images && Array.isArray(event.images) && event.images[0] ? (
                    <div className="relative w-full h-48 mb-2">
                        <Image
                            src={event.images[0]}
                            alt={event.title || 'Event'}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 mb-2 bg-muted flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}

                <div className="flex flex-col justify-between gap-2 p-2">
                    <h2 className="font-semibold text-md">{event?.title || 'Untitled Event'}</h2>
                    <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event?.date ?
                            format(new Date(event.date), 'MMM dd, yyyy') :
                            'Date not specified'
                        }
                    </div>
                    {isGuest && showAttendButton && (
                        <Button
                            className="w-full"
                            variant={isUserAttending ? "destructive" : "default"}
                            onClick={handleAttend}
                        >
                            {isUserAttending ? "Cancel Attendance" : "Attend Event"}
                        </Button>
                    )}
                </div>
            </CardContent>
        </EventCard>
    );
}