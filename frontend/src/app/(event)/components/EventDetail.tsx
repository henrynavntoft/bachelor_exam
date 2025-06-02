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

interface EventDetailProps {
    event: Event;
    isUserAttending?: boolean;
    onAttend?: () => Promise<void>;
    showActions?: boolean;
}

export function EventDetail({
    event,
    isUserAttending = false,
    onAttend,
    showActions = true
}: EventDetailProps) {
    const [chatLoading, setChatLoading] = useState(false);
    const { isGuest } = useAuth();
    const handleAttendClick = async () => {
        if (onAttend) {
            setChatLoading(true);
            await onAttend();
            setChatLoading(false);
        }
    };

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
            <section className="grid grid-cols-1 gap-4 mb-4">
                <div>
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
                            <p>{event.attendees?.length || 0} attending</p>
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

                    {/* Host information if available */}
                    {event.host && (
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
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
                </div>

                {/* Action buttons */}
                {showActions && onAttend && isGuest && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            className="w-full sm:w-auto"
                            size="lg"
                            variant={isUserAttending ? "destructive" : "default"}
                            onClick={handleAttendClick}
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
            </section>
        </article>
    );
} 