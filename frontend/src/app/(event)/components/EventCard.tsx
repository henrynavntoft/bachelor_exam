'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Card as CustomCard, CardContent, CardFooter } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, MapPin, Wallet, CookingPot } from 'lucide-react';
import { format } from "date-fns";
import { Role } from '@/lib/types/role';

interface EventCardProps {
    event: Event;
    currentUser: User | null;
    onEdit?: (event: Event) => void;
    onDelete?: (id: string) => void;
    showLocation?: boolean;
    showImageGallery?: boolean;
    featuredImageHeight?: string;
    className?: string;
    isClickable?: boolean;
    isAdminView?: boolean;
    showAttendControls?: boolean;
    isPastEvent?: boolean;
}

export function EventCard({
    event,
    currentUser,
    onEdit,
    onDelete,
    showLocation = true,
    showImageGallery = true,
    featuredImageHeight = 'h-48',
    className = '',
    isClickable = true,
    isAdminView = false,
    isPastEvent = false,
}: EventCardProps) {
    const router = useRouter();

    const isHost = currentUser?.id === event.hostId;
    const isAdmin = (currentUser?.role === Role.ADMIN) || isAdminView;

    const canEdit = isHost && onEdit && !isPastEvent;
    const showAdminDelete = isAdmin && !isHost && onDelete && !isPastEvent;
    const showHostDelete = isHost && onDelete && !isPastEvent;

    const handleCardClick = () => {
        if (isClickable && !isPastEvent) {
            router.push(`/events/${event.id}`);
        } else if (isPastEvent && isClickable) {
            router.push(`/events/${event.id}`);
        }
    };

    return (
        <CustomCard
            className={`overflow-hidden border-0 ${isClickable ? 'cursor-pointer' : ''} ${isPastEvent ? 'opacity-80' : ''} ${className}`}
            onClick={handleCardClick}
        >
            <CardContent className="p-0">
                {event?.images && Array.isArray(event.images) && event.images[0] ? (
                    <div className={`relative w-full ${featuredImageHeight} mb-2`}>
                        <Image
                            src={event.images[0]}
                            alt={event.title || 'Event'}
                            fill
                            className={`object-cover ${isPastEvent ? 'grayscale' : ''}`}
                        />
                        {isPastEvent && (
                            <div className="absolute top-2 right-2">
                                <span className="text-white font-semibold text-xs px-2 py-1 bg-black bg-opacity-80 rounded-full">
                                    Past Event
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`relative w-full ${featuredImageHeight} mb-2 bg-muted flex items-center justify-center`}>
                        <Calendar className="h-12 w-12 text-muted-foreground" />
                        {isPastEvent && (
                            <div className="absolute top-2 right-2">
                                <span className="text-white font-semibold text-xs px-2 py-1 bg-black bg-opacity-80 rounded-full">
                                    Past Event
                                </span>
                            </div>
                        )}
                    </div>
                )}
                {showImageGallery && event.images && event.images.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {event.images.slice(1).map((img: string) => (
                            <Image key={img} src={img} alt={event.title} width={60} height={60} />
                        ))}
                    </div>
                )}
                <section className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>

                    <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event?.date ?
                            format(new Date(event.date), 'MMM dd, yyyy, p') :
                            'Date not specified'
                        }
                    </div>

                    <div className="flex items-center text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        {showLocation && event.location && (
                            <p className="text-sm text-muted-foreground">{event.location}</p>
                        )}
                    </div>

                    <div className="flex items-center text-muted-foreground text-sm">
                        <CookingPot className="h-4 w-4 mr-2" />
                        {event.eventType && (
                            <p className="text-sm text-muted-foreground">
                                Type: {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1).toLowerCase()}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center text-muted-foreground text-sm">
                        <Wallet className="h-4 w-4 mr-2" />
                        {event.pricePerPerson !== null && event.pricePerPerson !== undefined && (
                            <p className="text-sm text-muted-foreground">
                                Price: {event.pricePerPerson > 0 ? `${Math.round(event.pricePerPerson)} DKK` : 'Free'}
                            </p>
                        )}
                    </div>

                </section>
                {(canEdit || showAdminDelete || showHostDelete) && (
                    <CardFooter className="flex items-center gap-2 pt-2 px-0">
                        {canEdit && (
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(event); }}>Edit</Button>
                        )}
                        {(showAdminDelete || showHostDelete) && onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" onClick={(e) => e.stopPropagation()}>Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (onDelete) onDelete(event.id); }}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </CardFooter>
                )}
            </CardContent>
        </CustomCard>
    );
} 