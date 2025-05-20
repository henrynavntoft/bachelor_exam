'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EventCard from "@/app/components/Card";
import { EventForm } from '@/app/components/EventForm';
import { HostEventCard } from '@/app/components/HostEventCard';
import { Event } from '@/types/event';
import { ProfileSection } from '@/components/users/ProfileSection';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface ProfileFormData {
    firstName: string;
    lastName: string;
    profilePicture?: File | string;
}

interface EventFormData {
    title: string;
    description: string;
    date: string;
    location: string;
    newImages?: File[];
    images?: string[];
    _imagesToDelete?: string[];
}

export default function ProfilePage() {
    const { isAuthenticated, isHost, user, isLoading, updateUserProfile } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // State
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Load host events
    const { data: events = [] } = useQuery<Event[]>({
        queryKey: ['host-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data.events || [];
        },
        enabled: isAuthenticated && isHost,
    });

    // Fetch events the user has RSVPed to
    const { data: rsvpedEvents, isLoading: isLoadingEvents } = useQuery<Event[]>({
        queryKey: ["rsvpedEvents"],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            const events = res.data.events || [];
            return events.filter((event: Event) =>
                event.attendees?.some(attendee => attendee.userId === user?.id)
            );
        },
        enabled: !!user,
    });

    // Add a query client subscription to refresh RSVPed events when attendance changes
    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe(() => {
            if (queryClient.getQueryData(['attendance'])) {
                queryClient.invalidateQueries({ queryKey: ['rsvpedEvents'] });
            }
        });
        return () => unsubscribe();
    }, [queryClient]);

    // Redirect unauthenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Submit handlers
    async function handleProfileSubmit(data: ProfileFormData) {
        if (!user) return;

        try {
            let profilePictureUrl = data.profilePicture;
            if (data.profilePicture instanceof File) {
                const fd = new FormData();
                fd.append('image', data.profilePicture);
                const uploadUrl = routes.upload.profile(user.id);
                const res = await axiosInstance.post(
                    uploadUrl,
                    fd,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                profilePictureUrl = res.data.url || res.data.location;
            }

            await axiosInstance.put(
                routes.users.update(user.id),
                { ...data, profilePicture: profilePictureUrl, email: user.email },
                { withCredentials: true }
            );

            // Update the Auth context to reflect changes immediately across the app
            updateUserProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                profilePicture: profilePictureUrl as string
            });

            toast.success("Profile updated successfully");
        } catch (err) {
            console.error('Update profile failed', err);
            toast.error("Failed to update profile");
        }
    }

    async function handleCreateSubmit(data: EventFormData) {
        try {
            const res = await axiosInstance.post(
                routes.events.create,
                {
                    title: data.title,
                    description: data.description,
                    date: new Date(data.date),
                    location: data.location,
                },
                { withCredentials: true }
            );
            const newEventId = res.data.id;

            let uploadedUrls: string[] = [];
            if (data.newImages && data.newImages.length > 0) {
                const ups = data.newImages.map(async (file: File) => {
                    const fd = new FormData();
                    fd.append('image', file);
                    const up = await axiosInstance.post(
                        routes.upload.upload(newEventId),
                        fd,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                    return up.data.url || up.data.location;
                });
                uploadedUrls = await Promise.all(ups);
            }

            if (uploadedUrls.length) {
                await axiosInstance.put(
                    routes.events.update(newEventId),
                    { images: uploadedUrls },
                    { withCredentials: true }
                );
            }

            await queryClient.invalidateQueries({ queryKey: ['host-events'] });
            setIsCreating(false);
            toast.success("Event created successfully");
        } catch (err) {
            console.error('Create event failed', err);
            toast.error("Failed to create event");
        }
    }

    async function handleEditSubmit(data: EventFormData) {
        if (!selectedEventId) return;

        try {
            const currentEvent = events.find(ev => ev.id === selectedEventId);
            if (!currentEvent) {
                throw new Error('Event not found');
            }

            // Process image deletions if any
            if (data._imagesToDelete && data._imagesToDelete.length > 0) {
                for (const imgUrl of data._imagesToDelete) {
                    try {
                        // Extract the image filename from the URL
                        const imageKey = imgUrl.split('/').pop();
                        if (imageKey) {
                            await axiosInstance.delete(
                                routes.upload.delete(selectedEventId),
                                {
                                    data: { key: imageKey },
                                    withCredentials: true
                                }
                            );
                            console.log(`Deleted image: ${imageKey}`);
                        }
                    } catch (err) {
                        console.error('Failed to delete image:', err);
                        // Continue with other deletions even if one fails
                    }
                }
            }

            let uploadedUrls: string[] = [];
            if (data.newImages && data.newImages.length > 0) {
                const ups = data.newImages.map(async (file: File) => {
                    const fd = new FormData();
                    fd.append('image', file);
                    const up = await axiosInstance.post(
                        routes.upload.upload(selectedEventId),
                        fd,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                    return up.data.url || up.data.location;
                });
                uploadedUrls = await Promise.all(ups);
            }

            await axiosInstance.put(
                routes.events.update(selectedEventId),
                {
                    title: data.title,
                    description: data.description,
                    date: new Date(data.date),
                    location: data.location,
                    images: [...(data.images || []), ...uploadedUrls],
                },
                { withCredentials: true }
            );

            await queryClient.invalidateQueries({ queryKey: ['host-events'] });
            setSelectedEventId(null);
            toast.success("Event updated successfully");
        } catch (err) {
            console.error('Edit event failed', err);
            toast.error("Failed to update event");
        }
    }

    async function handleDelete(eventId: string) {
        try {
            await axiosInstance.delete(routes.events.delete(eventId), { withCredentials: true });
            await queryClient.invalidateQueries({ queryKey: ['host-events'] });
            toast.success("Event deleted successfully");
        } catch (err) {
            console.error('Delete event failed', err);
            toast.error("Failed to delete event");
        }
    }

    // Loading state
    if (isLoading || !user) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-10">
            {/* User Profile */}
            <ProfileSection
                user={user}
                onUpdate={handleProfileSubmit}
                showEditButton={true}
            />

            {/* Event management sections can continue below */}
            {isHost ? (
                <article className="">
                    <h1 className="text-2xl font-bold mb-4 text-center">Host Profile</h1>

                    {/* CREATE EVENT */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Your Events</h3>
                        {isCreating ? (
                            <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => setIsCreating(true)}>
                                Create Event
                            </Button>
                        )}
                    </div>

                    {isCreating && (
                        <div className="my-4">
                            <EventForm onSubmit={handleCreateSubmit} onCancel={() => setIsCreating(false)} />
                        </div>
                    )}

                    {/* Event list */}
                    <div className="space-y-4 mt-6">
                        {events.length === 0 ? (
                            <p className="text-center text-muted-foreground">You haven&apos;t created any events yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {events.map((event) => (
                                    <HostEventCard
                                        key={event.id}
                                        event={event}
                                        onEdit={() => setSelectedEventId(event.id)}
                                        onDelete={() => handleDelete(event.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit event modal */}
                    {selectedEventId && (
                        <AlertDialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
                            <AlertDialogContent className="max-w-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Edit Event</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Make changes to your event here.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                {selectedEventId && (
                                    <EventForm
                                        initialData={events.find(e => e.id === selectedEventId)}
                                        onSubmit={handleEditSubmit}
                                        onCancel={() => setSelectedEventId(null)}
                                        existingImages={events.find(e => e.id === selectedEventId)?.images || []}
                                        isEditing
                                    />
                                )}
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </article>
            ) : (
                <article className="">
                    <h1 className="text-2xl font-bold mb-4 text-center">Guest Profile</h1>

                    <div className="pt-6">
                        <h2 className="text-xl font-semibold mb-4">Your RSVPs</h2>
                        {isLoadingEvents ? (
                            <LoadingSpinner />
                        ) : rsvpedEvents && rsvpedEvents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rsvpedEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        showAttendButton={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">You haven&apos;t RSVPed to any events yet.</p>
                        )}
                    </div>
                </article>
            )}
        </div>
    );
}