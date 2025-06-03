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
        upcomingEvents: Event[];
        pastEvents: Event[];
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

    const { data: eventsData = { upcomingEvents: [], pastEvents: [] }, isLoading: isLoadingEvents } = useQuery<{ upcomingEvents: Event[], pastEvents: Event[] }>({
        queryKey: ['host-events', user?.id], // Include user?.id in queryKey if events are user-specific
        queryFn: async () => {
            if (!user) return { upcomingEvents: [], pastEvents: [] }; // Or handle appropriately if user must be present
            // Assuming routes.events.all fetches events for the currently authenticated host
            // If you need to pass hostId specifically, adjust the API call
            const res = await axiosInstance.get(`${routes.events.all}?includePast=true`, { withCredentials: true });
            // Filter events to only those hosted by the current user IF the API doesn't do it
            const userEvents = (res.data.events || []).filter((event: Event) => event.hostId === user.id);
            
            // Separate events into upcoming and past
            const now = new Date();
            const upcomingEvents = userEvents.filter((event: Event) => new Date(event.date) >= now);
            const pastEvents = userEvents.filter((event: Event) => new Date(event.date) < now);
            
            return { upcomingEvents, pastEvents };
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
                // No images in initial creation - handled separately
            };

            const res = await axiosInstance.post(
                routes.events.create,
                createPayload,
                { withCredentials: true }
            );
            const newEventId = res.data.id;

            // Handle image uploads using the new event-images API
            if (data.newImages && data.newImages.length > 0) {
                for (let i = 0; i < data.newImages.length; i++) {
                    const file = data.newImages[i];
                    const fd = new FormData();
                    fd.append('image', file);
                    
                    // Upload image to get URL
                    const uploadResponse = await axiosInstance.post(
                        routes.upload.upload(newEventId),
                        fd,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                    
                    const imageUrl = uploadResponse.data.url || uploadResponse.data.location;
                    
                    // Add image to event using new API
                    await axiosInstance.post(
                        routes.eventImages.create(newEventId),
                        {
                            imageUrl: imageUrl,
                            altText: `${data.title} - Image ${i + 1}`,
                            order: i
                        },
                        { withCredentials: true }
                    );
                }
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
            const currentEvent = eventsData.upcomingEvents.find(ev => ev.id === selectedEventId) || eventsData.pastEvents.find(ev => ev.id === selectedEventId);
            if (!currentEvent) {
                throw new Error('Event not found');
            }

            // Handle image deletions using the new API
            if ((data as ExtendedEventFormData)._imagesToDelete && (data as ExtendedEventFormData)._imagesToDelete!.length > 0) {
                for (const imgUrl of (data as ExtendedEventFormData)._imagesToDelete!) {
                    try {
                        // Find the image by URL in the current event
                        const imageToDelete = currentEvent.images?.find(img => img.imageUrl === imgUrl);
                        if (imageToDelete) {
                            // Delete from event-images API
                            await axiosInstance.delete(
                                routes.eventImages.delete(selectedEventId, imageToDelete.id),
                                { withCredentials: true }
                            );
                            
                            // Delete from storage
                            const imageKey = imgUrl.split('/').pop();
                            if (imageKey) {
                                await axiosInstance.delete(
                                    routes.upload.delete(selectedEventId),
                                    { data: { key: imageKey }, withCredentials: true }
                                );
                            }
                        }
                    } catch (err) {
                        console.error('Failed to delete image:', err);
                    }
                }
            }

            // Handle new image uploads
            if (data.newImages && data.newImages.length > 0) {
                const existingImageCount = currentEvent.images?.length || 0;
                
                for (let i = 0; i < data.newImages.length; i++) {
                    const file = data.newImages[i];
                    const fd = new FormData();
                    fd.append('image', file);
                    
                    // Upload image to get URL
                    const uploadResponse = await axiosInstance.post(
                        routes.upload.upload(selectedEventId),
                        fd,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                    
                    const imageUrl = uploadResponse.data.url || uploadResponse.data.location;
                    
                    // Add image to event using new API
                    await axiosInstance.post(
                        routes.eventImages.create(selectedEventId),
                        {
                            imageUrl: imageUrl,
                            altText: `${data.title} - Image`,
                            order: existingImageCount + i
                        },
                        { withCredentials: true }
                    );
                }
            }

            // Update event basic fields (no images)
            const updatePayload = {
                title: data.title,
                description: data.description,
                date: new Date(data.date),
                location: data.location,
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

    if (isLoadingEvents && !eventsData.upcomingEvents.length && !eventsData.pastEvents.length) { // Show spinner if loading and no events yet displayed
        return <LoadingSpinner />;
    }

    return children({
        currentUser: user as User,
        upcomingEvents: eventsData.upcomingEvents,
        pastEvents: eventsData.pastEvents,
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