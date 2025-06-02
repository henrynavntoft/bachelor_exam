'use client';

import { useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user'; // Import User type
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import { EventFormData, ExtendedEventFormData } from '@/lib/schemas/event.schemas'; // Import from schemas

interface HostDataProviderProps {
    children: (data: {
        currentUser: User | null; // To pass to HostDashboard
        events: Event[];
        isCreating: boolean;
        selectedEventId: string | null;
        setIsCreating: (isCreating: boolean) => void;
        setSelectedEventId: (id: string | null) => void;
        handleCreateSubmit: (data: EventFormData) => Promise<void>;
        handleEditSubmit: (data: EventFormData) => Promise<void>;
        handleDelete: (eventId: string) => void;
        isLoadingEvents: boolean;
    }) => ReactNode;
}

export function HostDataProvider({ children }: HostDataProviderProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth(); // Get current user for passing to dashboard

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { data: events = [], isLoading: isLoadingEvents } = useQuery<Event[]>({
        queryKey: ['host-events', user?.id], // Include user?.id in queryKey if events are user-specific
        queryFn: async () => {
            if (!user) return []; // Or handle appropriately if user must be present
            // Assuming routes.events.all fetches events for the currently authenticated host
            // If you need to pass hostId specifically, adjust the API call
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            // Filter events to only those hosted by the current user IF the API doesn't do it
            return (res.data.events || []).filter((event: Event) => event.hostId === user.id);
        },
        enabled: !!user, // Only run if user is loaded
    });

    async function handleCreateSubmit(data: EventFormData) {
        if (!user) return;
        try {
            const createPayload = {
                title: data.title,
                description: data.description,
                date: new Date(data.date), // Prisma will store as UTC
                location: data.location,
                // hostId is set by the backend using req.user.userId
                pricePerPerson: data.pricePerPerson,
                eventType: data.eventType,
                capacity: data.capacity,
                images: data.images || [], // Existing image URLs (e.g. if editing and re-using schema)
                // newImages should NOT be in this initial JSON payload as they are File objects
                // and the backend createEventSchema no longer expects raw files in the initial creation step.
                // data.newImages (if any) will be used for the separate upload process after event creation.
            };

            const res = await axiosInstance.post(
                routes.events.create,
                createPayload,
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

            await queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            setIsCreating(false);
            toast.success("Event created successfully");
        } catch (err) {
            console.error('Create event failed', err);
            toast.error("Failed to create event");
        }
    }

    async function handleEditSubmit(data: EventFormData) {
        if (!selectedEventId || !user) return;

        try {
            const currentEvent = events.find(ev => ev.id === selectedEventId);
            if (!currentEvent) {
                throw new Error('Event not found');
            }

            if ((data as ExtendedEventFormData)._imagesToDelete && (data as ExtendedEventFormData)._imagesToDelete!.length > 0) {
                for (const imgUrl of (data as ExtendedEventFormData)._imagesToDelete!) {
                    try {
                        const imageKey = imgUrl.split('/').pop();
                        if (imageKey) {
                            await axiosInstance.delete(
                                routes.upload.delete(selectedEventId),
                                { data: { key: imageKey }, withCredentials: true }
                            );
                        }
                    } catch (err) {
                        console.error('Failed to delete image:', err);
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

            const existingImagesNotDeleted = currentEvent.images?.filter(
                img => !(data as ExtendedEventFormData)._imagesToDelete?.includes(img)
            ) || [];
            const finalImages = [...existingImagesNotDeleted, ...uploadedUrls];

            const updatePayload = {
                title: data.title,
                description: data.description,
                date: new Date(data.date),
                location: data.location,
                images: finalImages,
                pricePerPerson: data.pricePerPerson,
                eventType: data.eventType,
                capacity: data.capacity,
            };

            await axiosInstance.put(
                routes.events.update(selectedEventId),
                updatePayload,
                { withCredentials: true }
            );

            await queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            setSelectedEventId(null);
            toast.success("Event updated successfully");
        } catch (err) {
            console.error('Edit event failed', err);
            toast.error("Failed to update event");
        }
    }

    async function handleDelete(eventId: string) {
        if (!user) return;
        try {
            await axiosInstance.delete(routes.events.delete(eventId), { withCredentials: true });
            await queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            toast.success("Event deleted successfully");
        } catch (err) {
            console.error('Delete event failed', err);
            toast.error("Failed to delete event");
        }
    }

    if (isLoadingEvents && !events.length) { // Show spinner if loading and no events yet displayed
        return <LoadingSpinner />;
    }

    return children({
        currentUser: user as User,
        events,
        isCreating,
        selectedEventId,
        setIsCreating,
        setSelectedEventId,
        handleCreateSubmit,
        handleEditSubmit,
        handleDelete,
        isLoadingEvents
    });
} 