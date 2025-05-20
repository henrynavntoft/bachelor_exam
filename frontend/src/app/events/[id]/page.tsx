"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import axiosInstance from "@/lib/axios";
import { routes } from "@/lib/routes";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Users, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Chat from "@/app/components/Chat";
import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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
        <main className="flex flex-col gap-4">
            <article className="space-y-4">
                <section>
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                        <div className="w-full">
                            {event.images && event.images.length > 0 ? (
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: true,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {event.images.map((image, index) => (
                                            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                                <div className="aspect-square overflow-hidden rounded-lg">
                                                    <Image
                                                        src={image}
                                                        alt={`${event.title} - Image ${index + 1}`}
                                                        width={800}
                                                        height={800}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            ) : (
                                <p className="text-center py-8">
                                    No images available for this event
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Information about the event */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="">
                        <div>
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

                            {/* Attend event button */}
                            {isGuest && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        className="w-full sm:w-auto"
                                        size="lg"
                                        variant={isUserAttending ? "destructive" : "default"}
                                        onClick={handleAttend}
                                    >
                                        {isUserAttending ? "Cancel Attendance" : "Attend Event"}
                                    </Button>

                                    {/* Chat button - Only show for attendees */}
                                    {isUserAttending && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    className="w-full sm:w-auto"
                                                    size="lg"
                                                    disabled={chatLoading}
                                                >
                                                    <MessageCircle className="mr-2 h-5 w-5" />
                                                    Open Chat
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[70%] md:max-w-[60%] max-w-[90%] max-h-[90vh] h-[90vh]">
                                                <DialogHeader>
                                                    <DialogTitle>Event Chat</DialogTitle>
                                                    <DialogDescription>
                                                        Chat with other attendees of {event.title}
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <div className="flex-1 overflow-hidden h-full">
                                                    {chatLoading ? (
                                                        <div className="flex justify-center py-8">
                                                            <LoadingSpinner />
                                                        </div>
                                                    ) : (
                                                        <Chat eventId={eventId} />
                                                    )}
                                                </div>


                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </article>
        </main>
    );
} 