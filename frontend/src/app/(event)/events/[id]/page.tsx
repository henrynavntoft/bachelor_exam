"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import LoadingSpinner from "@/app/components/global/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { EventDetail } from "@/app/(event)/components/EventDetail";
import { Event } from "@/lib/types/event";

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const eventId = params.id as string;

    const { data: event, isLoading } = useQuery<Event>({
        queryKey: ["event", eventId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.one(eventId), { withCredentials: true });
            return res.data;
        },
    });

    // Check if user is attending this event
    const isUserAttending = event?.attendees?.some(
        (attendee) => attendee.userId === user?.id
    );

    // Get the quantity if the user is attending
    let rsvpQuantity: number | undefined = undefined;
    if (isUserAttending && user && event?.attendees) {
        const userAttendee = event.attendees.find(att => att.userId === user.id);
        // Ensure userAttendee and its quantity property exist
        if (userAttendee && typeof userAttendee.quantity === 'number') {
            rsvpQuantity = userAttendee.quantity;
        }
    }

    const handleAttend = async () => {
        if (!user) {
            toast.error("Please log in to attend events");
            return;
        }

        try {
            if (isUserAttending) {
                // Cancel attendance
                await axiosInstance.delete(routes.events.cancelAttend(eventId), { withCredentials: true });
                toast.success("Successfully canceled attendance");
            } else {
                // Attend event
                await axiosInstance.post(routes.events.attend(eventId), {}, { withCredentials: true });
                toast.success("Successfully RSVPed to event");
            }

            // Invalidate queries to refresh the data
            await queryClient.invalidateQueries({ queryKey: ["event", eventId] });
            await queryClient.invalidateQueries({ queryKey: ["events"] });
            await queryClient.invalidateQueries({ queryKey: ["rsvpedEvents"] });
            // Add invalidation for the specific attendance query key used by EventCard
            if (user?.id) { // Ensure user.id is available
                // Use refetchQueries for a more direct update of EventCard's attendance state
                await queryClient.refetchQueries({ queryKey: ["attendance", eventId, user.id], exact: true });
            }
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

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <LoadingSpinner />
            </main>
        );
    }

    if (!event) {
        return (
            <main>
                <h1 className="text-2xl font-bold">Event not found</h1>
                <Button
                    variant="ghost"
                    className="mt-4"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go back
                </Button>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 py-3">
            <EventDetail
                event={event}
                isUserAttending={isUserAttending}
                currentUserRsvpQuantity={rsvpQuantity}
                onAttend={handleAttend}
                showActions={true}
            />
        </main>
    );
} 