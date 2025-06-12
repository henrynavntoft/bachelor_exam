'use client';

import { useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { toast } from 'sonner';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import { ExtendedEventFormData } from '@/lib/schemas/event.schemas';

interface HostDataProviderProps {
    children: (data: {
        currentUser: User | null;
        upcomingEvents: Event[];
        pastEvents: Event[];
        isCreating: boolean;
        selectedEventId: string | null;
        setIsCreating: (isCreating: boolean) => void;
        setSelectedEventId: (id: string | null) => void;
        handleCreateSubmit: (data: ExtendedEventFormData) => Promise<void>;
        handleEditSubmit: (data: ExtendedEventFormData) => Promise<void>;
        handleDelete: (eventId: string) => void;
        isLoadingEvents: boolean;
    }) => ReactNode;
}

export function HostDataProvider({ children }: HostDataProviderProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { data: eventsData = { upcomingEvents: [], pastEvents: [] }, isLoading: isLoadingEvents } = useQuery<{ upcomingEvents: Event[], pastEvents: Event[] }>({
        queryKey: ['host-events', user?.id],
        queryFn: async () => {
            if (!user) return { upcomingEvents: [], pastEvents: [] };
            
            const res = await axiosInstance.get(`${routes.events.all}?includePast=true`, { withCredentials: true });
            const userEvents = (res.data.events || []).filter((event: Event) => event.hostId === user.id);
            
            const now = new Date();
            const upcomingEvents = userEvents.filter((event: Event) => new Date(event.date) >= now);
            const pastEvents = userEvents.filter((event: Event) => new Date(event.date) < now);
            
            return { upcomingEvents, pastEvents };
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
    });

    async function handleCreateSubmit(data: ExtendedEventFormData) {
        if (!user) return;
        
        const createPayload = {
            title: data.title,
            description: data.description,
            date: new Date(data.date),
            location: data.location,
            pricePerPerson: data.pricePerPerson,
            eventType: data.eventType,
            capacity: data.capacity,
        };

        try {
            const res = await axiosInstance.post(routes.events.create, createPayload, { withCredentials: true });
            const eventId = res.data.id;

            // Handle images if any
            if (data.newImages && data.newImages.length > 0) {
                for (let i = 0; i < data.newImages.length; i++) {
                    const file = data.newImages[i];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    try {
                        const uploadRes = await axiosInstance.post(routes.upload.upload(eventId), formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        await axiosInstance.post(routes.eventImages.create(eventId), {
                            imageUrl: uploadRes.data.url || uploadRes.data.location,
                            altText: `${data.title} - Image ${i + 1}`,
                            order: i
                        }, { withCredentials: true });
                    } catch (err) {
                        console.error('Image upload failed:', err);
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            setIsCreating(false);
            toast.success("Event created successfully");
        } catch {
            toast.error("Failed to create event");
        }
    }

    async function handleEditSubmit(data: ExtendedEventFormData) {
        if (!selectedEventId || !user) return;

        try {
            const currentEvent = eventsData.upcomingEvents.find(ev => ev.id === selectedEventId) || 
                                eventsData.pastEvents.find(ev => ev.id === selectedEventId);

            // Delete images if needed
            if (data._imagesToDelete && data._imagesToDelete.length > 0) {
                for (const imgUrl of data._imagesToDelete) {
                    try {
                        const imageToDelete = currentEvent?.images?.find(img => img.imageUrl === imgUrl);
                        if (imageToDelete) {
                            await axiosInstance.delete(routes.eventImages.delete(selectedEventId, imageToDelete.id), { withCredentials: true });
                        }
                    } catch (err) {
                        console.error('Failed to delete image:', err);
                    }
                }
            }

            // Upload new images if any
            if (data.newImages && data.newImages.length > 0) {
                const existingCount = currentEvent?.images?.length || 0;
                for (let i = 0; i < data.newImages.length; i++) {
                    const file = data.newImages[i];
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    try {
                        const uploadRes = await axiosInstance.post(routes.upload.upload(selectedEventId), formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        await axiosInstance.post(routes.eventImages.create(selectedEventId), {
                            imageUrl: uploadRes.data.url || uploadRes.data.location,
                            altText: `${data.title} - Image`,
                            order: existingCount + i
                        }, { withCredentials: true });
                    } catch (err) {
                        console.error('Image upload failed:', err);
                    }
                }
            }

            // Update event
            const updatePayload = {
                title: data.title,
                description: data.description,
                date: new Date(data.date),
                location: data.location,
                pricePerPerson: data.pricePerPerson,
                eventType: data.eventType,
                capacity: data.capacity,
            };

            await axiosInstance.put(routes.events.update(selectedEventId), updatePayload, { withCredentials: true });
            queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            setSelectedEventId(null);
            toast.success("Event updated successfully");
        } catch {
            toast.error("Failed to update event");
        }
    }

    async function handleDelete(eventId: string) {
        if (!user) return;
        
        try {
            await axiosInstance.delete(routes.events.delete(eventId), { withCredentials: true });
            queryClient.invalidateQueries({ queryKey: ['host-events', user.id] });
            toast.success("Event deleted successfully");
        } catch {
            toast.error("Failed to delete event");
        }
    }

    if (isLoadingEvents && !eventsData.upcomingEvents.length && !eventsData.pastEvents.length) {
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