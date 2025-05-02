'use client';

import Image from 'next/image';
import { useAuth, User } from '@/context/AuthContext';
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
    hostId: string;
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    images: string[];
}


export default function ProfilePage() {
    const { isAuthenticated, isHost, isGuest, isLoading, user } = useAuth();
    // Cast user to include profile fields
    const currentUser = user as User;
    const router = useRouter();
    const queryClient = useQueryClient();

    // Refs
    const imageRef = useRef<HTMLInputElement>(null);
    const createImageRef = useRef<HTMLInputElement>(null);

    // Shared state
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    // Edit form state
    const [formValues, setFormValues] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        images: [] as string[],
    });
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    // Create form state
    const [isCreating, setIsCreating] = useState(false);
    const [createFormValues, setCreateFormValues] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
    });
    const [createPreviewImages, setCreatePreviewImages] = useState<string[]>([]);

    // Load host events
    const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['host-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isHost,
    });


    // Redirect unauthenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    // Preview handlers
    const handleFileChange = () => {
        const files = imageRef.current?.files;
        if (files) {
            setPreviewImages(Array.from(files).map(f => URL.createObjectURL(f)));
        }
    };
    const handleCreateFileChange = () => {
        const files = createImageRef.current?.files;
        if (files) {
            setCreatePreviewImages(Array.from(files).map(f => URL.createObjectURL(f)));
        }
    };

    // Mark existing image for deletion
    function handleRemoveImage(url: string) {
        setFormValues(v => ({ ...v, images: v.images.filter(i => i !== url) }));
        setImagesToDelete(d => [...d, url]);
    }

    // Submit edits
    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedEventId) return;

        // upload new files
        let uploadedUrls: string[] = [];
        const files = imageRef.current?.files;
        if (files && files.length) {
            const ups = Array.from(files).map(async file => {
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

        // send update
        await axiosInstance.put(
            routes.events.update(selectedEventId),
            {
                title: formValues.title,
                description: formValues.description,
                date: new Date(formValues.date),
                location: formValues.location,
                images: [...formValues.images, ...uploadedUrls],
            },
            { withCredentials: true }
        );
        // delete removed images
        await Promise.all(
            imagesToDelete.map(url => {
                const key = new URL(url).pathname.replace(/^\/?/, '');
                return axiosInstance.delete(routes.upload.delete(selectedEventId), { data: { key } });
            })
        );
        // refresh
        await queryClient.invalidateQueries({ queryKey: ['host-events'] });

        // reset
        setSelectedEventId(null);
        setFormValues({ title: '', description: '', date: '', location: '', images: [] });
        setImagesToDelete([]);
        setPreviewImages([]);
    }

    // Submit create
    async function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            // 1) create the event
            const res = await axiosInstance.post(
                routes.events.create,
                {
                    title: createFormValues.title,
                    description: createFormValues.description,
                    date: new Date(createFormValues.date),
                    location: createFormValues.location,
                },
                { withCredentials: true }
            );
            const newEventId = res.data.id;

            // 2) upload selected files
            let uploadedUrls: string[] = [];
            const files = createImageRef.current?.files;
            if (files && files.length) {
                const ups = Array.from(files).map(async file => {
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

            // 3) attach images if any
            if (uploadedUrls.length) {
                await axiosInstance.put(
                    routes.events.update(newEventId),
                    { images: uploadedUrls },
                    { withCredentials: true }
                );
            }

            // refresh
            await queryClient.invalidateQueries({ queryKey: ['host-events'] });

            // reset
            setCreateFormValues({ title: '', description: '', date: '', location: '' });
            setCreatePreviewImages([]);
            if (createImageRef.current) createImageRef.current.value = '';
            setIsCreating(false);
        } catch (err) {
            console.error('Create event failed', err);
        }
    }

    if (isLoading || (isHost && eventsLoading)) {
        return <LoadingSpinner />;
    }
    if (!isHost && !isGuest) {
        return <LoadingSpinner />;
    }

    return isHost ? (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Host Profile</h1>
            <h2 className="text-xl mb-2">Your Events:</h2>
            {/* User profile info */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-medium mb-2">Your Profile</h3>
                <p><strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Role:</strong> {currentUser.role}</p>
                <p><strong>User ID</strong> {currentUser.id}</p>
                <p><strong>Events Created:</strong> {events.filter(ev => ev.hostId === currentUser.id).length}</p>
            </div>

            {/* CREATE EVENT */}
            <AlertDialog open={isCreating} onOpenChange={setIsCreating}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">Create New Event</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Fill in the details below and click Create Event.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <form className="flex flex-col gap-4 p-4" onSubmit={handleCreateSubmit}>
                        <input
                            type="text"
                            placeholder="Title"
                            required
                            value={createFormValues.title}
                            onChange={e => setCreateFormValues(v => ({ ...v, title: e.target.value }))}
                            className="border rounded p-2"
                        />
                        <textarea
                            placeholder="Description"
                            required
                            value={createFormValues.description}
                            onChange={e => setCreateFormValues(v => ({ ...v, description: e.target.value }))}
                            className="border rounded p-2"
                        />
                        <input
                            type="date"
                            required
                            value={createFormValues.date}
                            onChange={e => setCreateFormValues(v => ({ ...v, date: e.target.value }))}
                            className="border rounded p-2"
                        />
                        <input
                            type="text"
                            placeholder="Location"
                            required
                            value={createFormValues.location}
                            onChange={e => setCreateFormValues(v => ({ ...v, location: e.target.value }))}
                            className="border rounded p-2"
                        />

                        {/* previews for create */}
                        <div className="flex flex-wrap gap-2">
                            {createPreviewImages.map((src, i) => (
                                <Image key={i} src={src} alt="preview" width={80} height={80} className="rounded opacity-50" />
                            ))}
                        </div>
                        <input
                            type="file"
                            multiple
                            ref={createImageRef}
                            onChange={handleCreateFileChange}
                            className="border rounded p-2"
                        />

                        <AlertDialogCancel onClick={() => setIsCreating(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button type="submit">Create Event</Button>
                        </AlertDialogAction>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

            {/* LIST & EDIT EVENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                {events.filter(ev => ev.hostId === currentUser.id).map(event => (
                    <Card key={event.id}>
                        <CardContent className="flex justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{event.title}</h3>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                                <p className="text-sm">{format(new Date(event.date), 'MM/dd/yyyy')}</p>
                                <p className="text-sm">{event.location}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {event.images.map(img => (
                                        <Image key={img} src={img} alt={event.title} width={80} height={80} className="rounded" />
                                    ))}
                                </div>
                            </div>
                            <CardFooter className="flex items-start">
                                {event.hostId === currentUser.id && (
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
                                                    setImagesToDelete([]);
                                                    if (imageRef.current) imageRef.current.value = '';
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Edit Event</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Update details and Save Changes.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <form className="flex flex-col gap-4 p-4" onSubmit={handleEditSubmit}>
                                                <input
                                                    type="text"
                                                    placeholder="Title"
                                                    value={formValues.title}
                                                    onChange={e => setFormValues(v => ({ ...v, title: e.target.value }))}
                                                    className="border rounded p-2"
                                                />
                                                <textarea
                                                    placeholder="Description"
                                                    value={formValues.description}
                                                    onChange={e => setFormValues(v => ({ ...v, description: e.target.value }))}
                                                    className="border rounded p-2"
                                                />
                                                <input
                                                    type="date"
                                                    value={formValues.date}
                                                    onChange={e => setFormValues(v => ({ ...v, date: e.target.value }))}
                                                    className="border rounded p-2"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Location"
                                                    value={formValues.location}
                                                    onChange={e => setFormValues(v => ({ ...v, location: e.target.value }))}
                                                    className="border rounded p-2"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {formValues.images.map(img => (
                                                        <div key={img} className="relative">
                                                            <Image src={img} alt="existing" width={80} height={80} className="rounded" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveImage(img)}
                                                                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {previewImages.map((src, i) => (
                                                        <Image key={i} src={src} alt="preview" width={80} height={80} className="rounded opacity-50" />
                                                    ))}
                                                </div>
                                                <input
                                                    type="file"
                                                    multiple
                                                    ref={imageRef}
                                                    onChange={handleFileChange}
                                                    className="border rounded p-2"
                                                />
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button type="submit">Save Changes</Button>
                                                </AlertDialogAction>
                                            </form>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </CardFooter>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    ) : (
        <div>Guest Profile</div>
    );
}