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
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import EventCard from "@/app/components/Card";
import { Loader2 } from "lucide-react";

// Interfaces
interface Event {
    hostId: string;
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    images: string[];
    attendees?: Array<{
        userId: string;
        eventId: string;
    }>;
}

// Zod Schemas
const profileSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    // Accept File or string or undefined for profilePicture
    profilePicture: z.union([
        z.instanceof(File),
        z.string(),
        z.undefined(),
    ]).optional(),
});

const eventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    date: z.string().min(1, 'Date is required'),
    location: z.string().min(1, 'Location is required'),
    images: z.array(z.string()).optional(),
    newImages: z.array(z.instanceof(File))
        .optional()
        .refine(
            (files) => !files || files.length <= 5,
            "Maximum 5 images allowed"
        )
        .refine(
            (files) => !files || files.every(file => file.size <= 3 * 1024 * 1024),
            "Each image must be less than 3MB"
        )
        .refine(
            (files) => !files || files.every(file =>
                ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            ),
            "Only JPEG, PNG, and WebP images are allowed"
        ),
});

type EventFormData = z.infer<typeof eventSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { isAuthenticated, isHost, isGuest, isLoading, user } = useAuth();
    const currentUser = user as User;
    const router = useRouter();
    const queryClient = useQueryClient();

    // Refs
    const imageRef = useRef<HTMLInputElement>(null);
    const createImageRef = useRef<HTMLInputElement>(null);

    // Shared state
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [createPreviewImages, setCreatePreviewImages] = useState<string[]>([]);

    // Form state
    const [isCreating, setIsCreating] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Form hooks
    const createEventForm = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            date: '',
            location: '',
        },
    });

    const editEventForm = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            date: '',
            location: '',
        },
    });

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            profilePicture: currentUser?.profilePicture || '',
        },
    });
    const profilePictureValue = profileForm.watch("profilePicture");

    // Update form values when user data changes
    useEffect(() => {
        if (currentUser) {
            profileForm.reset({
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                profilePicture: currentUser.profilePicture,
            });
        }
    }, [currentUser, profileForm]);

    // Load host events
    const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
        queryKey: ['host-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isHost,
    });

    // Fetch events the user has RSVPed to
    const { data: rsvpedEvents, isLoading: isLoadingEvents } = useQuery<Event[]>({
        queryKey: ["rsvpedEvents"],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            // Filter events where the user is an attendee
            return res.data.filter((event: Event) =>
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

    // Preview handlers
    const handleFileChange = () => {
        const files = imageRef.current?.files;
        if (files) {
            // Check file sizes
            const oversizedFiles = Array.from(files).filter(file => file.size > 3 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.error("Some files exceed 3MB limit. Please select smaller files.");
                if (imageRef.current) imageRef.current.value = '';
                return;
            }
            setPreviewImages(Array.from(files).map(f => URL.createObjectURL(f)));
        }
    };

    const handleCreateFileChange = () => {
        const files = createImageRef.current?.files;
        if (files) {
            // Check file sizes
            const oversizedFiles = Array.from(files).filter(file => file.size > 3 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                toast.error("Some files exceed 3MB limit. Please select smaller files.");
                if (createImageRef.current) createImageRef.current.value = '';
                return;
            }
            setCreatePreviewImages(Array.from(files).map(f => URL.createObjectURL(f)));
        }
    };

    // Mark existing image for deletion
    function handleRemoveImage(url: string) {
        setImagesToDelete(d => [...d, url]);
    }

    // Submit handlers
    async function handleCreateSubmit(data: EventFormData) {
        try {
            // Validate the form data with Zod
            const result = eventSchema.safeParse(data);
            if (!result.success) {
                // Show validation errors
                const errors = result.error.errors;
                errors.forEach(error => {
                    toast.error(error.message);
                });
                return;
            }

            // 1) create the event
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

            // 2) upload selected files
            let uploadedUrls: string[] = [];
            if (data.newImages && data.newImages.length > 0) {
                const ups = data.newImages.map(async file => {
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
            createEventForm.reset();
            setCreatePreviewImages([]);
            if (createImageRef.current) createImageRef.current.value = '';
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
            // Validate the form data with Zod
            const result = eventSchema.safeParse(data);
            if (!result.success) {
                // Show validation errors
                const errors = result.error.errors;
                errors.forEach(error => {
                    toast.error(error.message);
                });
                return;
            }

            // Get current event to preserve existing images
            const currentEvent = events.find(ev => ev.id === selectedEventId);
            if (!currentEvent) {
                throw new Error('Event not found');
            }

            // Filter out images marked for deletion
            const remainingImages = currentEvent.images.filter(img => !imagesToDelete.includes(img));

            // Upload new files if any
            let uploadedUrls: string[] = [];
            if (data.newImages && data.newImages.length > 0) {
                const ups = data.newImages.map(async file => {
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

            // Combine remaining and new images
            const allImages = [...remainingImages, ...uploadedUrls];

            // send update
            await axiosInstance.put(
                routes.events.update(selectedEventId),
                {
                    title: data.title,
                    description: data.description,
                    date: new Date(data.date),
                    location: data.location,
                    images: allImages,
                },
                { withCredentials: true }
            );

            // delete removed images
            if (imagesToDelete.length > 0) {
                await Promise.all(
                    imagesToDelete.map(url => {
                        const key = new URL(url).pathname.replace(/^\/?/, '');
                        return axiosInstance.delete(routes.upload.delete(selectedEventId), { data: { key } });
                    })
                );
            }

            // refresh
            await queryClient.invalidateQueries({ queryKey: ['host-events'] });

            // reset
            setSelectedEventId(null);
            editEventForm.reset();
            setImagesToDelete([]);
            setPreviewImages([]);
            if (imageRef.current) imageRef.current.value = '';
            toast.success("Event updated successfully");
        } catch (err) {
            console.error('Edit event failed', err);
            toast.error("Failed to update event");
        }
    }

    async function handleProfileSubmit(data: ProfileFormData) {
        try {
            let profilePictureUrl = data.profilePicture;
            // If profilePicture is a File, upload it and get the URL
            if (data.profilePicture instanceof File) {
                const fd = new FormData();
                fd.append('image', data.profilePicture);
                const uploadUrl = routes.upload.profile(currentUser.id);
                console.log('Uploading to:', uploadUrl);
                const res = await axiosInstance.post(
                    uploadUrl,
                    fd,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                profilePictureUrl = res.data.url || res.data.location;
            }

            await axiosInstance.put(
                routes.users.update(currentUser.id),
                { ...data, profilePicture: profilePictureUrl, email: currentUser.email },
                { withCredentials: true }
            );
            // Update the user context with new data
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.profilePicture = profilePictureUrl as string;
            }
            setIsEditingProfile(false);
            toast.success("Profile updated successfully");
        } catch (err) {
            console.error('Update profile failed', err);
            toast.error("Failed to update profile");
        }
    }

    // Delete handler
    async function handleDelete(eventId: string) {
        try {
            await axiosInstance.delete(routes.events.delete(eventId), { withCredentials: true });
            await queryClient.invalidateQueries({ queryKey: ['host-events'] });
        } catch (err) {
            console.error('Delete event failed', err);
        }
    }

    if (isLoading || (isHost && eventsLoading)) {
        return <LoadingSpinner />;
    }
    if (!isHost && !isGuest) {
        return <LoadingSpinner />;
    }

    return isHost ? (
        <article className="">
            <h1 className="text-2xl font-bold mb-4 text-center">Host Profile</h1>

            {/* User profile info */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Your Profile</h3>
                    {isEditingProfile ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>
                            Cancel
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>
                {isEditingProfile ? (
                    <Form {...profileForm}>
                        <form
                            onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                            className="flex flex-col gap-4"
                        >
                            <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your first name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your last name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="profilePicture"
                                render={({ field: { onChange, onBlur, name, ref } }) => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onBlur={onBlur}
                                                name={name}
                                                ref={ref}
                                                onChange={(e) => onChange(e.target.files?.[0])}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Profile picture preview */}
                            {profilePictureValue instanceof File && (
                                <div className="mb-2">
                                    <Label>Preview</Label>
                                    <Image
                                        src={URL.createObjectURL(profilePictureValue)}
                                        alt="Profile Preview"
                                        width={100}
                                        height={100}
                                        className="rounded border"
                                    />
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full mt-2"
                                disabled={profileForm.formState.isSubmitting}
                            >
                                {profileForm.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Profile'
                                )}
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-2">
                        <p><strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                    </div>
                )}
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
                    <Form {...createEventForm}>
                        <form className="flex flex-col gap-2 p-4" onSubmit={createEventForm.handleSubmit(handleCreateSubmit)}>
                            <FormField
                                control={createEventForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createEventForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createEventForm.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createEventForm.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input type="text" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* previews for create */}
                            <div className="flex flex-wrap gap-2">
                                {createPreviewImages.map((src, i) => (
                                    <Image key={i} src={src} alt="preview" width={80} height={80} className="rounded opacity-50" />
                                ))}
                            </div>
                            <FormField
                                control={createEventForm.control}
                                name="newImages"
                                render={({ field: { onChange, ...field } }) => (
                                    <FormItem>
                                        <FormLabel>Images</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files) {
                                                        const fileArray = Array.from(files);
                                                        // Validate file count
                                                        if (fileArray.length > 5) {
                                                            toast.error("Maximum 5 images allowed");
                                                            e.target.value = ''; // Clear the input
                                                            return;
                                                        }
                                                        // Validate file types and sizes
                                                        const invalidFiles = fileArray.filter(file =>
                                                            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                                                            file.size > 3 * 1024 * 1024
                                                        );
                                                        if (invalidFiles.length > 0) {
                                                            toast.error("Some files are invalid. Only JPEG, PNG, and WebP images under 3MB are allowed.");
                                                            e.target.value = ''; // Clear the input
                                                            return;
                                                        }
                                                        onChange(fileArray);
                                                        handleCreateFileChange();
                                                    }
                                                }}
                                                {...field}
                                                value={undefined}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <AlertDialogAction asChild>
                                <Button type="submit">Create Event</Button>
                            </AlertDialogAction>
                            <AlertDialogCancel onClick={() => setIsCreating(false)}>Cancel</AlertDialogCancel>

                        </form>
                    </Form>
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
                                    <>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedEventId(event.id);
                                                        editEventForm.reset({
                                                            title: event.title,
                                                            description: event.description,
                                                            date: format(new Date(event.date), 'yyyy-MM-dd'),
                                                            location: event.location,
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
                                                <Form {...editEventForm}>
                                                    <form className="flex flex-col gap-4 p-4" onSubmit={editEventForm.handleSubmit(handleEditSubmit)}>
                                                        <FormField
                                                            control={editEventForm.control}
                                                            name="title"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Title</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={editEventForm.control}
                                                            name="description"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Description</FormLabel>
                                                                    <FormControl>
                                                                        <Textarea {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={editEventForm.control}
                                                            name="date"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Date</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="date" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={editEventForm.control}
                                                            name="location"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Location</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="text" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <div className="flex flex-wrap gap-2">
                                                            {event.images.map(img => (
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
                                                        <FormField
                                                            control={editEventForm.control}
                                                            name="newImages"
                                                            render={({ field: { onChange, ...field } }) => (
                                                                <FormItem>
                                                                    <FormLabel>Add Images</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="file"
                                                                            multiple
                                                                            accept=".jpg,.jpeg,.png,.webp"
                                                                            onChange={(e) => {
                                                                                const files = e.target.files;
                                                                                if (files) {
                                                                                    const fileArray = Array.from(files);
                                                                                    // Validate file count
                                                                                    if (fileArray.length > 5) {
                                                                                        toast.error("Maximum 5 images allowed");
                                                                                        e.target.value = ''; // Clear the input
                                                                                        return;
                                                                                    }
                                                                                    // Validate file types and sizes
                                                                                    const invalidFiles = fileArray.filter(file =>
                                                                                        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                                                                                        file.size > 3 * 1024 * 1024
                                                                                    );
                                                                                    if (invalidFiles.length > 0) {
                                                                                        toast.error("Some files are invalid. Only JPEG, PNG, and WebP images under 3MB are allowed.");
                                                                                        e.target.value = ''; // Clear the input
                                                                                        return;
                                                                                    }
                                                                                    onChange(fileArray);
                                                                                    handleFileChange();
                                                                                }
                                                                            }}
                                                                            {...field}
                                                                            value={undefined}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <AlertDialogAction asChild>
                                                            <Button type="submit">Save Changes</Button>
                                                        </AlertDialogAction>

                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (selectedEventId) handleDelete(selectedEventId);
                                                            }}
                                                        >
                                                            Delete Event
                                                        </Button>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>

                                                    </form>
                                                </Form>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleDelete(event.id)}
                                            className="ml-2"
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </article>
    ) : (
        <article className="">
            <h1 className="text-2xl font-bold mb-4 text-center">Guest Profile</h1>

            {/* User profile info */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Your Profile</h3>
                    {isEditingProfile ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>
                            Cancel
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>
                {isEditingProfile ? (
                    <Form {...profileForm}>
                        <form className="flex flex-col gap-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                            <FormField
                                control={profileForm.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your first name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your last name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="profilePicture"
                                render={({ field: { onChange, onBlur, name, ref } }) => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                onBlur={onBlur}
                                                name={name}
                                                ref={ref}
                                                onChange={(e) => onChange(e.target.files?.[0])}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Profile picture preview */}
                            {profilePictureValue instanceof File && (
                                <div className="mb-2">
                                    <Label>Preview</Label>
                                    <Image
                                        src={URL.createObjectURL(profilePictureValue)}
                                        alt="Profile Preview"
                                        width={100}
                                        height={100}
                                        className="rounded border"
                                    />
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full mt-2"
                                disabled={profileForm.formState.isSubmitting}
                            >
                                {profileForm.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Profile'
                                )}
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <div className="space-y-2">
                        <p><strong>Name:</strong> {currentUser.firstName} {currentUser.lastName}</p>
                        <p><strong>Email:</strong> {currentUser.email}</p>
                    </div>
                )}
            </div>

            <div className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Events You&apos;re Attending</h2>
                {isLoadingEvents ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : rsvpedEvents && rsvpedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rsvpedEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">You haven&apos;t RSVPed to any events yet.</p>
                )}
            </div>
        </article>
    );
}