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
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Calendar } from 'lucide-react';
import { format } from "date-fns";
import { Role } from '@/lib/types/role';

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

    const { data: isUserAttending, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ['attendance', event.id, currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return false;
            if (event.attendees?.some(attendee => attendee.userId === currentUser.id)) return true;
            try {
                const res = await axiosInstance.get(routes.events.one(event.id), { withCredentials: true });
                const eventData = res.data;
                return eventData.attendees?.some((attendee: { userId: string; }) => attendee.userId === currentUser.id) || false;
            } catch (error) {
                console.error('Error checking attendance:', error);
                return false;
            }
        },
        enabled: !!currentUser && showAttendControls,
    });

    const handleAttend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            toast.error("Please log in to attend events");
            return;
        }
        try {
            if (isUserAttending) {
                await axiosInstance.delete(routes.events.cancelAttend(event.id), { withCredentials: true });
                toast.success("Successfully canceled attendance");
            } else {
                await axiosInstance.post(routes.events.attend(event.id), {}, { withCredentials: true });
                toast.success("Successfully RSVPed to event");
            }
            queryClient.invalidateQueries({ queryKey: ['attendance', event.id, currentUser.id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['rsvpedEvents', currentUser.id] });
            queryClient.invalidateQueries({ queryKey: ['host-events', currentUser.id] });
        } catch (error) {
            console.error('Error updating attendance:', error);
            const message = error instanceof AxiosError ? error.response?.data?.message : "Failed to update attendance";
            toast.error(message || "Failed to update attendance");
        }
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
                <div>
                    <h3 className="text-lg font-semibold mb-1">{event.title}</h3>

                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event?.date ?
                            format(new Date(event.date), 'MMM dd, yyyy, p') :
                            'Date not specified'
                        }
                    </div>

                    {showLocation && event.location && (
                        <p className="text-sm text-muted-foreground mb-2">{event.location}</p>
                    )}
                </div>
                {(canEdit || showAdminDelete || showHostDelete || (showAttendControls && isGuest)) && (
                    <CardFooter className="flex flex-col sm:flex-row items-center gap-2 p-0">
                        {showAttendControls && isGuest && (
                            <Button
                                className="w-full sm:w-auto"
                                variant={isUserAttending ? "destructive" : "default"}
                                onClick={handleAttend}
                                disabled={isLoadingAttendance}
                            >
                                {isLoadingAttendance ? 'Loading...' : (isUserAttending ? "Cancel Attendance" : "Attend Event")}
                            </Button>
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
        </CustomCard>
    );
} 