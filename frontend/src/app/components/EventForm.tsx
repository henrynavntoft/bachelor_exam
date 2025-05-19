import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/app/components/FileInput";
import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { MapboxLocationInput } from "./MapboxLocationInput";

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
            (files) => !files || files.every(file => file.size <= 10 * 1024 * 1024),
            "Each image must be less than 10MB"
        )
        .refine(
            (files) => !files || files.every(file =>
                ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff', 'image/ico', 'image/heic', 'image/heif'].includes(file.type)
            ),
            "Only images are allowed"
        ),
});

type EventFormData = z.infer<typeof eventSchema>;

interface ExtendedEventFormData extends EventFormData {
    _imagesToDelete?: string[];
}

interface EventFormProps {
    initialData?: Partial<EventFormData> & { id?: string };
    onSubmit: (data: EventFormData) => Promise<void>;
    onCancel: () => void;
    existingImages?: string[];
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
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            date: initialData?.date ? initialData.date : '',
            location: '',
            ...initialData,
        },
    });

    const handleRemoveImage = (imgUrl: string) => {
        setImagesToDelete(prev => [...prev, imgUrl]);
        if (onImageDelete) {
            onImageDelete(imgUrl);
        }
    };

    const handleSubmit = async (data: EventFormData) => {
        const updatedImages = existingImages?.filter(img => !imagesToDelete.includes(img)) || [];

        await onSubmit({
            ...data,
            images: updatedImages,
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
                            <FormLabel>Title</FormLabel>
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
                                <Input type="date" {...field} />
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
                            .filter(img => !imagesToDelete.includes(img))
                            .map(img => (
                                <div key={img} className="relative">
                                    <Image src={img} alt="existing" width={80} height={80} className="rounded" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(img)}
                                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                    </div>
                )}

                {previewImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {previewImages.map((src, i) => (
                            <Image key={i} src={src} alt="preview" width={80} height={80} className="rounded opacity-50" />
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
                                <FileInput
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(files) => {
                                        field.onChange(files);
                                        if (files.length > 0) {
                                            setPreviewImages(files.map(file => URL.createObjectURL(file)));
                                        } else {
                                            setPreviewImages([]);
                                        }
                                    }}
                                    maxFiles={5}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2">
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-foreground" />
                                {isEditing ? 'Saving...' : 'Creating...'}
                            </>
                        ) : (
                            isEditing ? 'Save Changes' : 'Create Event'
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Form>
    );
} 