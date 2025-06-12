import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MapboxLocationInput } from "@/app/components/home/MapboxLocationInput";
import { eventSchema, EventFormData, ExtendedEventFormData } from "@/lib/schemas/event.schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventImage } from "@/lib/types/event";

// Define EventType enum values for Select component
const eventTypes = ["BREAKFAST", "LUNCH", "DINNER", "SPECIAL"] as const;

interface EventFormProps {
    initialData?: Partial<EventFormData> & { id?: string };
    onSubmit: (data: ExtendedEventFormData) => Promise<void>;
    onCancel: () => void;
    existingImages?: EventImage[];
    onImageDelete?: (url: string) => void;
    isEditing?: boolean;
}

export function EventForm({
    initialData,
    onSubmit,
    onCancel,
    existingImages = [],
    onImageDelete,
    isEditing = false
}: EventFormProps) {
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            date: initialData?.date
                ? new Date(initialData.date).toISOString().slice(0, 16)
                : '',
            location: initialData?.location || '',
            eventType: initialData?.eventType || eventTypes[0],
            pricePerPerson: initialData?.pricePerPerson === undefined ? null : initialData.pricePerPerson,
            capacity: initialData?.capacity === undefined ? null : initialData.capacity,
            images: initialData?.images || [],
            newImages: [],
        },
    });

    const handleRemoveImage = (imgUrl: string) => {
        setImagesToDelete(prev => [...prev, imgUrl]);
        if (onImageDelete) {
            onImageDelete(imgUrl);
        }
    };

    const handleSubmit = async (data: EventFormData) => {
        await onSubmit({
            ...data,
            _imagesToDelete: imagesToDelete
        } as ExtendedEventFormData);
    };



    return (
        <Form {...form}>
            <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(handleSubmit)}
            >
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
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
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <MapboxLocationInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {isEditing && existingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {existingImages
                            .filter(img => !imagesToDelete.includes(img.imageUrl))
                            .map(img => (
                                <div key={img.id} className="relative">
                                    <Image 
                                        src={img.imageUrl} 
                                        alt={img.altText || "Event image"} 
                                        width={80} 
                                        height={80} 
                                        className="rounded object-cover" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(img.imageUrl)}
                                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="newImages"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{isEditing ? 'Add Images' : 'Images'}</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        field.onChange(files);
                                    }}
                                    className="cursor-pointer"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="pricePerPerson"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price Per Person</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="50"
                                    {...field}
                                    value={field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an event type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {eventTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="6"
                                    {...field}
                                    value={field.value === null || field.value === undefined ? '' : field.value}
                                    onChange={e => {
                                        const value = e.target.value;
                                        field.onChange(value === '' ? null : parseInt(value, 10));
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2">
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="flex-1"
                    >
                        {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditing ? 'Update Event' : 'Create Event'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Form>
    );
} 