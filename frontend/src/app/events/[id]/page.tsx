"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const { isGuest, user } = useAuth();
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
            <main className="p-4">
                <h1 className="text-2xl font-bold">Event not found</h1>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Content on the left */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                            <div className="flex items-center gap-4 text-gray-600 mb-6">
                                <p>{format(new Date(event.date), "MMMM dd, yyyy")}</p>
                                <span>•</span>
                                <p>{event.location}</p>
                            </div>
                            {isGuest && (
                                <Button
                                    className="w-full sm:w-auto"
                                    variant={isUserAttending ? "destructive" : "default"}
                                    onClick={handleAttend}
                                >
                                    {isUserAttending ? "Cancel Attendance" : "Attend Event"}
                                </Button>
                            )}
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">About this event</h2>
                            <p className="text-gray-700 leading-relaxed">{event.description}</p>
                        </div>
                    </div>

                    {/* Images on the right */}
                    <div className="space-y-4">
                        {event.images.map((image, index) => (
                            <div key={image}>
                                <Image
                                    src={image}
                                    alt={`${event.title} - Image ${index + 1}`}
                                    width={500}
                                    height={500}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
} 