'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { Attendee } from '@/lib/types/attendee';
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
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Calendar, MapPin, Wallet, CookingPot } from 'lucide-react';
import { format } from "date-fns";
import { Role } from '@/lib/types/role';
import { useState } from 'react';
import { AttendEventModal } from '@/components/modals/AttendEventModal';

interface EventCardProps {
    event: Event;
    currentUser: User | null;
    onEdit?: (event: Event) => void;
    onDelete?: (id: string) => void;
    showAttendControls?: boolean;
    showLocation?: boolean;
    showImageGallery?: boolean;
    featuredImageHeight?: string;
    className?: string;
    isClickable?: boolean;
    isAdminView?: boolean;
}

export function EventCard({
    event,
    currentUser,
    onEdit,
    onDelete,
    showAttendControls = false,
    showLocation = true,
    showImageGallery = true,
    featuredImageHeight = 'h-48',
    className = '',
    isClickable = true,
    isAdminView = false,
}: EventCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isGuest } = useAuth();

    const [isAttendModalOpen, setIsAttendModalOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    const eventForModal = event ? {
        id: event.id,
        title: event.title,
        date: event.date,
        pricePerPerson: event.pricePerPerson,
        capacity: event.capacity
    } : null;

    const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ['attendance', event.id, currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return { isAttending: false, quantity: 0 };

            // Always fetch the specific event's current details for attendance status
            try {
                const res = await axiosInstance.get(routes.events.one(event.id), { withCredentials: true });
                const freshEventData: Event = res.data;
                const attendeeRecord = freshEventData.attendees?.find((att: Attendee) => att.userId === currentUser.id);

                if (attendeeRecord && typeof attendeeRecord.quantity === 'number') {
                    return { isAttending: true, quantity: attendeeRecord.quantity };
                }
                return { isAttending: false, quantity: 0 };
            } catch (error) {
                console.error('Error fetching event details for attendance status in EventCard:', event.id, error);
                return { isAttending: false, quantity: 0 }; // Default on error
            }
        },
        enabled: !!currentUser && showAttendControls,
    });

    const isUserAttending = attendanceData?.isAttending;
    const rsvpQuantity = attendanceData?.quantity;

    const openAttendModalHandler = () => {
        if (!event) return;
        setIsAttendModalOpen(true);
    };

    const closeAttendModalHandler = () => {
        setIsAttendModalOpen(false);
    };

    const handleConfirmAttendance = async (eventId: string, quantity: number) => {
        if (!currentUser) {
            toast.error("Please log in to attend events");
            throw new Error("User not logged in");
        }
        try {
            await axiosInstance.post(routes.events.attend(eventId), { quantity }, { withCredentials: true });
            // Invalidate this card's specific attendance query for immediate feedback
            queryClient.invalidateQueries({ queryKey: ['attendance', eventId, currentUser.id] });
            // Broader invalidations for lists and event detail page
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['rsvpedEvents', currentUser.id] });
            queryClient.invalidateQueries({ queryKey: ['host-events'] });
        } catch (error) {
            console.error('Error confirming attendance in EventCard:', error);
            throw error;
        }
    };

    const handleAttendButtonClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            toast.error("Please log in to attend events");
            return;
        }

        if (isUserAttending) {
            setIsCancelConfirmOpen(true);
        } else {
            openAttendModalHandler();
        }
    };

    const handleConfirmCancelAttendance = async () => {
        if (!currentUser || !event) return;

        try {
            await axiosInstance.delete(routes.events.cancelAttend(event.id), { withCredentials: true });
            toast.success("Successfully canceled attendance");
            // Invalidate this card's specific attendance query for immediate feedback
            queryClient.invalidateQueries({ queryKey: ['attendance', event.id, currentUser.id] });
            // Broader invalidations
            queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['rsvpedEvents', currentUser.id] });
            queryClient.invalidateQueries({ queryKey: ['host-events'] });
        } catch (error) {
            console.error('Error canceling attendance:', error);
            const message = error instanceof AxiosError ? error.response?.data?.message : "Failed to cancel attendance";
            toast.error(message || "Failed to cancel attendance");
        }
        setIsCancelConfirmOpen(false);
    };

    const isHost = currentUser?.id === event.hostId;
    const isAdmin = (currentUser?.role === Role.ADMIN) || isAdminView;

    const canEdit = isHost && onEdit;
    const showAdminDelete = isAdmin && !isHost && onDelete;
    const showHostDelete = isHost && onDelete;

    const handleCardClick = () => {
        if (isClickable) {
            router.push(`/events/${event.id}`);
        }
    };

    return (
        <CustomCard
            className={`overflow-hidden border-0 ${isClickable ? 'cursor-pointer' : ''} ${className}`}
            onClick={handleCardClick}
        >
            <CardContent className="p-0">
                {event?.images && Array.isArray(event.images) && event.images[0] ? (
                    <div className={`relative w-full ${featuredImageHeight} mb-2`}>
                        <Image
                            src={event.images[0]}
                            alt={event.title || 'Event'}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className={`w-full ${featuredImageHeight} mb-2 bg-muted flex items-center justify-center`}>
                        <Calendar className="h-12 w-12 text-muted-foreground" />
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
                            <p className="text-sm text-muted-foreground mb-2">
                                Price: {event.pricePerPerson > 0 ? `${Math.round(event.pricePerPerson)} DKK` : 'Free'}
                            </p>
                        )}
                    </div>

                </section>
                {(canEdit || showAdminDelete || showHostDelete || (showAttendControls && isGuest)) && (
                    <CardFooter className="flex items-center gap-2 pt-2 px-0">
                        {showAttendControls && isGuest && (
                            <>
                                {isUserAttending ? (
                                    <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="w-full sm:w-auto"
                                                variant={"destructive"}
                                                onClick={(e) => { e.stopPropagation(); setIsCancelConfirmOpen(true); }}
                                                disabled={isLoadingAttendance}
                                            >
                                                {isLoadingAttendance ? 'Loading...' :
                                                    (isUserAttending ? `Cancel RSVP (${rsvpQuantity} spot${rsvpQuantity === 1 ? '' : 's'})` : "Attend Event")}
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
                                                    onClick={handleConfirmCancelAttendance}
                                                >
                                                    Confirm Cancellation
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button
                                        className="w-full sm:w-auto"
                                        variant={"default"}
                                        onClick={handleAttendButtonClick}
                                        disabled={isLoadingAttendance}
                                    >
                                        {isLoadingAttendance ? 'Loading...' : "Attend Event"}
                                    </Button>
                                )}
                            </>
                        )}
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

            <AttendEventModal
                event={eventForModal}
                isOpen={isAttendModalOpen}
                onClose={closeAttendModalHandler}
                onConfirm={handleConfirmAttendance}
            />
        </CustomCard>
    );
} 