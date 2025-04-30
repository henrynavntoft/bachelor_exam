'use client';

import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction,
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
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
    });

    const imageRef = useRef<HTMLInputElement>(null);

    const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['host-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isHost,
    });

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEventId) return;

        let uploadedImageUrls: string[] = [];

        const files = imageRef.current?.files;
        if (files && files.length > 0) {
            const uploads = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('image', file);

                const uploadRes = await axiosInstance.post(routes.upload.upload, formData, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                return uploadRes.data.url;
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
                    images: uploadedImageUrls,
                },
                { withCredentials: true }
            );
            router.refresh();
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
                                                    });
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
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="border rounded p-2"
                                                    ref={imageRef}
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