'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    image: string[];
    images: string[];
}

export default function ProfilePage() {
    const { isAuthenticated, isHost, isGuest, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        images: [] as string[],
    });

    // Add state to track images marked for deletion
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    // Add state to track preview images of newly selected files
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    const imageRef = useRef<HTMLInputElement>(null);

    const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['host-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isHost,
    });

    // Modify handleRemoveImage to mark image for deletion
    async function handleRemoveImage(imageUrl: string) {
        setFormValues((prev) => ({
            ...prev,
            images: prev.images.filter((url) => url !== imageUrl),
        }));
        setImagesToDelete((prev) => [...prev, imageUrl]);
    }

    // Handler to show previews when files are selected
    const handleFileChange = () => {
        const files = imageRef.current?.files;
        if (files) {
            const previews = Array.from(files).map((file) => URL.createObjectURL(file));
            setPreviewImages(previews);
        }
    };

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEventId) return;

        let uploadedImageUrls: string[] = [];

        const files = imageRef.current?.files;
        if (files && files.length > 0) {
            const uploads = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);

                const uploadRes = await axiosInstance.post(
                    routes.upload.upload,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        withCredentials: true,
                    }
                );

                return uploadRes.data.url || uploadRes.data.location;
            });

            try {
                uploadedImageUrls = await Promise.all(uploads);
            } catch (uploadError) {
                console.error('Image upload failed', uploadError);
                return;
            }
        }

        try {
            await axiosInstance.put(
                routes.events.update(selectedEventId),
                {
                    title: formValues.title,
                    description: formValues.description,
                    date: new Date(formValues.date),
                    location: formValues.location,
                    images: [...formValues.images, ...uploadedImageUrls],
                },
                { withCredentials: true }
            );

            // Perform image deletions after event update
            await Promise.all(
                imagesToDelete.map((imageUrl) => {
                    const key = new URL(imageUrl).pathname.replace(/^\/?/, '');
                    return axiosInstance.delete(routes.upload.delete, {
                        data: { key },
                        withCredentials: true,
                    });
                })
            );

            // Update the cached events data to reflect the edited event instantly
            queryClient.setQueryData<Event[]>(['host-events'], (old) =>
                old?.map(ev =>
                    ev.id === selectedEventId
                        ? { ...ev, ...formValues, images: [...formValues.images, ...uploadedImageUrls] }
                        : ev
                ) ?? []
            );

            // Clear form state
            setSelectedEventId(null);
            setFormValues({ title: '', description: '', date: '', location: '', images: [] });
            setImagesToDelete([]);
            setPreviewImages([]);
        } catch (err) {
            console.error("Update failed", err);
        }
    }

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router, isLoading]);

    if (isLoading || (isHost && eventsLoading)) {
        return <LoadingSpinner />;
    }

    if (!isHost && !isGuest) {
        return <LoadingSpinner />;
    }

    if (isHost) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Host Profile</h1>
                <h2 className="text-xl mb-2">Your Events:</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <Card key={event.id}>
                            <CardContent className="flex flex-row justify-between">
                                <div className="flex flex-col gap-2">
                                    <h1>{event.title}</h1>
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'MM/dd/yyyy')}</p>
                                    <p className="text-sm text-muted-foreground">{event.location}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {event.images.map((image) => (
                                            <Image key={image} src={image} alt={event.title} width={100} height={100} />
                                        ))}
                                    </div>
                                </div>

                                <CardFooter className="flex justify-end">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedEventId(event.id);
                                                    setFormValues({
                                                        title: event.title,
                                                        description: event.description,
                                                        date: format(new Date(event.date), 'yyyy-MM-dd'),
                                                        location: event.location,
                                                        images: event.images,
                                                    });
                                                    setPreviewImages([]);
                                                    if (imageRef.current) {
                                                        imageRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="p-2">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Edit Event</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Update the details below and click Save Changes.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <form className="flex flex-col gap-4 p-4" onSubmit={handleEditSubmit}>
                                                <input
                                                    type="text"
                                                    value={formValues.title}
                                                    onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                                                    className="border rounded p-2"
                                                    placeholder="Event Title"
                                                />
                                                <textarea
                                                    value={formValues.description}
                                                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                                                    className="border rounded p-2"
                                                    placeholder="Event Description"
                                                />
                                                <input
                                                    type="date"
                                                    value={formValues.date}
                                                    onChange={(e) => setFormValues({ ...formValues, date: e.target.value })}
                                                    className="border rounded p-2"
                                                />
                                                <input
                                                    type="text"
                                                    value={formValues.location}
                                                    onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                                                    className="border rounded p-2"
                                                    placeholder="Event Location"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {formValues.images.map((image) => (
                                                        <div key={image} className="relative">
                                                            <Image src={image} alt="event image" width={80} height={80} className="rounded" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(image)}
                                                                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {previewImages.map((src, index) => (
                                                        <div key={index} className="relative">
                                                            <Image src={src} alt="preview" width={80} height={80} className="rounded opacity-50" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="border rounded p-2"
                                                    ref={imageRef}
                                                    onChange={handleFileChange}
                                                />


                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button type="submit">
                                                        Save Changes
                                                    </Button>
                                                </AlertDialogAction>
                                            </form>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (isGuest) {
        return <div>Guest Profile</div>;
    }
}