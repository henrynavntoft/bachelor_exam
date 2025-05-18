"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Chat from "@/app/components/Chat";
import { useState } from "react";

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
    const [chatLoading, setChatLoading] = useState(false);

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
                setChatLoading(true);
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
        <main className="flex flex-col gap-4">
            <div className="">

                <article className="space-y-4">
                    <div className="">
                        <div className="border p-6">
                            <h2 className="text-xl font-semibold mb-4">Event Gallery</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {event.images && event.images.length > 0 ? (
                                    event.images.map((image, index) => (
                                        <div key={index} className="overflow-hidden">
                                            <Image
                                                src={image}
                                                alt={`${event.title} - Image ${index + 1}`}
                                                width={300}
                                                height={300}
                                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-8">
                                        No images available for this event
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="">
                            <div className="border p-6">
                                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

                                {/* Event metadata with icons */}
                                <div className="flex flex-col space-y-3 mb-6">
                                    <div className="flex items-center">
                                        <Calendar className="h-5 w-5 mr-2" />
                                        <p>{format(new Date(event.date), "EEEE, MMMM dd, yyyy 'at' h:mm a")}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-5 w-5 mr-2" />
                                        <p>{event.location}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-5 w-5 mr-2" />
                                        <p>{event.attendees?.length || 0} attending</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="prose max-w-none mb-6">
                                    <h3 className="text-xl font-semibold mb-2">About this event</h3>
                                    <p className="leading-relaxed whitespace-pre-line">
                                        {event.description}
                                    </p>
                                </div>


                                {isGuest && (
                                    <Button
                                        className="w-full sm:w-auto mt-4"
                                        size="lg"
                                        variant={isUserAttending ? "destructive" : "default"}
                                        onClick={handleAttend}
                                    >
                                        {isUserAttending ? "Cancel Attendance" : "Attend Event"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Chat section - Only show for attendees */}
                            {isUserAttending && (
                                <div className="">
                                    {chatLoading ? (
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner />
                                        </div>
                                    ) : (
                                        <Chat eventId={eventId} />
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </article>
            </div>
        </main>
    );
} 