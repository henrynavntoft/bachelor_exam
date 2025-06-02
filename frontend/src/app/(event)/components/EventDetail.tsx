'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, MessageCircle, Wallet, CookingPot } from 'lucide-react';
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
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
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


interface EventDetailProps {
    event: Event;
    isUserAttending?: boolean;
    currentUserRsvpQuantity?: number;
    onAttend?: () => Promise<void>;
    showActions?: boolean;
}

export function EventDetail({
    event,
    isUserAttending = false,
    currentUserRsvpQuantity,
    onAttend,
    showActions = true
}: EventDetailProps) {
    const [chatLoading, setChatLoading] = useState(false);
    const { isGuest, user } = useAuth();
    // State for cancel confirmation dialog
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    const handleAttendClick = async () => {
        if (isUserAttending) {
            // If user is attending, open confirmation dialog
            setIsCancelConfirmOpen(true);
        } else {
            // If user is not attending, proceed with onAttend (which opens AttendEventModal via EventPage)
            if (onAttend) {
                setChatLoading(true); // Keep this for the attend flow if needed
                await onAttend();
                setChatLoading(false);
            }
        }
    };

    // New handler for actual cancellation after confirmation
    const handleConfirmCancel = async () => {
        if (!onAttend) return; // onAttend from EventPage.tsx handles the actual API call

        try {
            // We assume onAttend in EventPage.tsx handles the DELETE request and toasts
            // So we just need to call it and it will do its thing (including query invalidations)
            await onAttend();
        } catch (error) {
            // Error handling is likely in EventPage.tsx's onAttend, but good to have a catch here too
            console.error("Error during confirmed cancel in EventDetail:", error);
            toast.error("Failed to cancel attendance. Please try again.");
        }
        setIsCancelConfirmOpen(false); // Close the dialog
    };

    // Debug logs for host and full event data
    console.log("Event host:", event.host);
    console.log("Full event data:", event);
    return (
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
                                <p>{event.host.firstName} {event.host.lastName}</p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    {showActions && onAttend && isGuest && (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {isUserAttending ? (
                                <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            className="w-full sm:w-auto"
                                            size="lg"
                                            variant={"destructive"} // Always destructive if attending
                                            onClick={(e) => { e.stopPropagation(); setIsCancelConfirmOpen(true); }} // Open dialog
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
                                                onClick={handleConfirmCancel} // Call confirmation handler
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
                                    variant={"default"} // Default variant for attending
                                    onClick={handleAttendClick} // This calls onAttend which opens the modal
                                >
                                    {"Attend Event"}
                                </Button>
                            )}

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
                                    <DialogContent className="h-screen w-full border-none lg:max-w-[70%] lg:h-[90%]">
                                        <DialogHeader>
                                            <DialogTitle>{event.title}</DialogTitle>
                                        </DialogHeader>

                                        <div className="flex-1 overflow-hidden h-full">
                                            {chatLoading ? (
                                                <div className="flex justify-center py-8">
                                                    <LoadingSpinner />
                                                </div>
                                            ) : (
                                                <Chat eventId={event.id} />
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </article>
    );
} 