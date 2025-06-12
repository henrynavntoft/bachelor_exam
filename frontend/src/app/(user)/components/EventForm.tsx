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

// Reusable form field components
const TextFormField = ({ control, name, label, placeholder, required = false }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label} {required && "*"}</FormLabel>
                <FormControl>
                    <Input placeholder={placeholder} {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

const TextareaFormField = ({ control, name, label, placeholder }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Textarea placeholder={placeholder} {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

const NumberFormField = ({ control, name, label, placeholder }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Input
                        type="number"
                        placeholder={placeholder}
                        {...field}
                        value={field.value === null || field.value === undefined ? '' : field.value}
                        onChange={e => {
                            const value = e.target.value;
                            field.onChange(value === '' ? null : 
                                name === 'pricePerPerson' ? parseFloat(value) : parseInt(value, 10));
                        }}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

const DateTimeFormField = ({ control, name, label }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

const SelectFormField = ({ control, name, label, options, placeholder }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {options.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )}
    />
);

const FileFormField = ({ control, name, label, accept, multiple = false }: any) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <Input
                        type="file"
                        multiple={multiple}
                        accept={accept}
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            field.onChange(multiple ? files : files[0]);
                        }}
                        className="cursor-pointer"
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
);

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

    const eventTypeOptions = eventTypes.map(type => ({
        value: type,
        label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    }));

    return (
        <Form {...form}>
            <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(handleSubmit)}
            >
                <TextFormField
                    control={form.control}
                    name="title"
                    label="Title"
                    required={true}
                />

                <TextareaFormField
                    control={form.control}
                    name="description"
                    label="Description"
                />

                <DateTimeFormField
                    control={form.control}
                    name="date"
                    label="Date"
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

                <FileFormField
                    control={form.control}
                    name="newImages"
                    label={isEditing ? 'Add Images' : 'Images'}
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple={true}
                />

                <NumberFormField
                    control={form.control}
                    name="pricePerPerson"
                    label="Price Per Person"
                    placeholder="50"
                />

                <SelectFormField
                    control={form.control}
                    name="eventType"
                    label="Event Type"
                    options={eventTypeOptions}
                    placeholder="Select an event type"
                />

                <NumberFormField
                    control={form.control}
                    name="capacity"
                    label="Capacity"
                    placeholder="6"
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