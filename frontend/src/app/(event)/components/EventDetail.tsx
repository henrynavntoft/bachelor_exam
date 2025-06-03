'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, MessageCircle, Wallet, CookingPot, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/lib/types/event';
import {
    Carousel,
    CarouselContent,
    CarouselItem
} from '@/components/ui/carousel';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import Chat from '@/app/(event)/components/Chat';
import { useAuth } from '@/context/AuthContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AttendEventModal } from '@/app/(event)/components/AttendEventModal';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { AttendeeCard } from '@/app/(event)/components/AttendeeCard';

interface EventDetailProps {
    event: Event;
    isUserAttending?: boolean;
    currentUserRsvpQuantity?: number;
    showActions?: boolean;
    onAttend?: () => Promise<void>;
}

// Type guard for AxiosError
function isAxiosError(error: unknown): error is AxiosError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as AxiosError).isAxiosError === true
    );
}

export function EventDetail({
    event,
    isUserAttending = false,
    currentUserRsvpQuantity,
    showActions = true
}: EventDetailProps) {
    const { isGuest, user } = useAuth();
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isAttendModalOpen, setIsAttendModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();

    // Fetch host's average rating
    const { data: hostRating } = useQuery({
        queryKey: ['hostRating', event.hostId],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.averageRating(event.hostId), { withCredentials: true });
            return res.data;
        },
        enabled: !!event.hostId,
    });

    // Check if event is in the past
    const isPastEvent = new Date(event.date) < new Date();

    const handleAttendClick = async () => {
        if (isPastEvent) return; // Don't allow attending past events
        if (isUserAttending) {
            setIsCancelConfirmOpen(true);
        } else {
            setIsAttendModalOpen(true);
        }
    };

    const handleConfirmAttendance = async (eventId: string, quantity: number) => {
        if (!user) {
            toast.error("Please log in to attend events");
            return;
        }
        try {
            await axiosInstance.post(routes.events.attend(eventId), { quantity }, { withCredentials: true });
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['rsvpedEvents', user.id] });
            queryClient.invalidateQueries({ queryKey: ['host-events'] });
            setIsAttendModalOpen(false);
            toast.success("Successfully registered for the event!");
        } catch (error: unknown) {
            if (
                isAxiosError(error) &&
                error.response?.status === 400 &&
                error.response.data &&
                typeof (error.response.data as { message?: unknown }).message === 'string'
            ) {
                toast.error((error.response.data as { message: string }).message);
            } else {
                toast.error("Failed to register for the event. Please try again.");
            }
            // Do NOT close the modal or show success toast here
        }
    };

    const handleConfirmCancel = async () => {
        if (!user) return;

        try {
            await axiosInstance.delete(routes.events.cancelAttend(event.id), { withCredentials: true });
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['rsvpedEvents', user.id] });
            queryClient.invalidateQueries({ queryKey: ['host-events'] });
            toast.success("Successfully canceled attendance");
        } catch (error) {
            console.error("Error during confirmed cancel in EventDetail:", error);
            toast.error("Failed to cancel attendance. Please try again.");
        }
        setIsCancelConfirmOpen(false);
    };

    // Debug logs for host and full event data
    console.log("Event host:", event.host);
    console.log("Full event data:", event);
    return (
        <>
            <article className="space-y-6">
                <section>
                    <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

                    {/* Event images carousel */}
                    <div className="w-full mb-6">
                        {event.images && event.images.length > 0 ? (
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-2 md:-ml-4">
                                    {event.images.map((image) => (
                                        <CarouselItem key={image.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                            <div className="aspect-square overflow-hidden rounded-lg">
                                                <Image
                                                    src={image.imageUrl}
                                                    alt={image.altText || `${event.title} - Image`}
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
                            <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                                <p className="text-muted-foreground">No images available</p>
                            </div>
                        )}
                    </div>

                    {/* Event description */}
                    <div className="prose dark:prose-invert mb-6 max-w-[800px]">
                        <p>{event.description}</p>
                    </div>
                </section>

                {/* Event metadata with icons */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 mr-3 text-brand" />
                                <p>{format(new Date(event.date), "EEEE, MMMM dd, yyyy 'at' h:mm a")}</p>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 mr-3 text-brand" />
                                <p>{event.location}</p>
                            </div>
                            <div className="flex items-center">
                                <Users className="h-5 w-5 mr-3 text-brand" />
                                <p>{event.attendees?.reduce((sum, attendee) => sum + (attendee.quantity || 0), 0) || 0} attending</p>
                            </div>
                            {/* Display Event Type */}
                            {event.eventType && (
                                <div className="flex items-center">
                                    <CookingPot className="h-5 w-5 mr-3 text-brand" />
                                    <p>{event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1).toLowerCase()}</p>
                                </div>
                            )}
                            {/* Display Price Per Person */}
                            {event.pricePerPerson !== null && event.pricePerPerson !== undefined && (
                                <div className="flex items-center">
                                    <Wallet className="h-5 w-5 mr-3 text-brand" />
                                    <p>{event.pricePerPerson > 0 ? `${Math.round(event.pricePerPerson)} DKK per person` : 'Free'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {/* Host information if available */}
                        {event.host && (
                            <div className="flex items-center gap-3 pb-4 rounded-lg">
                                {event.host.profilePicture ? (
                                    <Image
                                        src={event.host.profilePicture}
                                        alt={`${event.host.firstName} ${event.host.lastName}`}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-brand-foreground">
                                        {event.host.firstName?.[0]}{event.host.lastName?.[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">Hosted by</p>
                                    <button 
                                        onClick={() => router.push(`/profile/${event.hostId}`)}
                                        className="text-left hover:text-brand transition-colors cursor-pointer p-0 bg-transparent border-none"
                                    >
                                        <p className="hover:underline">{event.host.firstName} {event.host.lastName}</p>
                                    </button>
                                    {hostRating && hostRating.averageRating && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="h-4 w-4 text-brand fill-current" />
                                            <span className="text-sm text-muted-foreground">
                                                {Number(hostRating.averageRating).toFixed(1)} ({hostRating.ratingCount} reviews)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        {showActions && isGuest && !isPastEvent && (
                            <div className="flex flex-col gap-4">
                                {isUserAttending ? (
                                    <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="w-full sm:w-auto"
                                                size="lg"
                                                variant={"destructive"}
                                                onClick={(e) => { e.stopPropagation(); setIsCancelConfirmOpen(true); }}
                                            >
                                                {isUserAttending
                                                    ? `Cancel RSVP (${currentUserRsvpQuantity !== undefined ? currentUserRsvpQuantity : event.attendees?.find(att => att.userId === user?.id)?.quantity || 0} spot${(currentUserRsvpQuantity !== undefined ? currentUserRsvpQuantity : event.attendees?.find(att => att.userId === user?.id)?.quantity || 0) === 1 ? '' : 's'})`
                                                    : "Attend Event"}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel RSVP</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to cancel your RSVP for &quot;{event.title}&quot;?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setIsCancelConfirmOpen(false)}>Back</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={handleConfirmCancel}
                                                >
                                                    Confirm Cancellation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button
                                        className="w-full sm:w-auto"
                                        size="lg"
                                        variant={"default"}
                                        onClick={handleAttendClick}
                                    >
                                        {"Attend Event"}
                                    </Button>
                                )}

                                {/* Chat button - Only show for attendees */}
                                {isUserAttending && !isPastEvent && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="w-full sm:w-auto"
                                                size="lg"
                                            >
                                                <MessageCircle className="mr-2 h-5 w-5" />
                                                Open Chat
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="h-screen w-full border-none lg:max-w-[70%] lg:h-[90%]">
                                            <DialogHeader>
                                                <DialogTitle>{event.title}</DialogTitle>
                                            </DialogHeader>

                                            <div className="flex-1 overflow-hidden h-full">
                                                <Chat eventId={event.id} />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        )}

                        {/* Past event message */}
                        {isPastEvent && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-center text-muted-foreground font-medium">This event has ended</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* People Participating Section */}
                {event.attendees && event.attendees.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6 text-brand" />
                            People Participating ({event.attendees.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {event.attendees.map((attendee) => (
                                attendee.user && (
                                    <AttendeeCard
                                        key={attendee.id}
                                        userId={attendee.user.id}
                                        firstName={attendee.user.firstName}
                                        lastName={attendee.user.lastName}
                                        profilePicture={attendee.user.profilePicture || ''}
                                        quantity={attendee.quantity}
                                    />
                                )
                            ))}
                        </div>
                    </section>
                )}
            </article>

            <AttendEventModal
                event={{
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    pricePerPerson: event.pricePerPerson,
                    capacity: event.capacity
                }}
                isOpen={isAttendModalOpen}
                onClose={() => setIsAttendModalOpen(false)}
                onConfirm={handleConfirmAttendance}
            />
        </>
    );
} 