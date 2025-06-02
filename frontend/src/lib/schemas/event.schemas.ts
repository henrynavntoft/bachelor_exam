import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/ico',
    'image/heic',
    'image/heif',
];

// Define EventType enum values for Zod schema
const eventTypes = ["BREAKFAST", "LUNCH", "DINNER", "SPECIAL"] as const;

export const eventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    date: z.string().min(1, 'Date is required'), // Keep as string for datetime-local input
    location: z.string().min(1, 'Location is required'),
    pricePerPerson: z.coerce.number().positive({ message: "Price must be a positive number" }).optional().nullable(), // Added pricePerPerson
    eventType: z.enum(eventTypes, { required_error: 'Event type is required' }), // Added eventType
    images: z.array(z.string()).optional(), // For existing image URLs
    newImages: z.array(z.instanceof(File))
        .optional()
        .refine(
            (files) => !files || files.length <= 5,
            "Maximum 5 images allowed"
        )
        .refine(
            (files) => !files || files.every(file => file.size <= MAX_FILE_SIZE),
            `Each image must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
        )
        .refine(
            (files) => !files || files.every(file => ALLOWED_IMAGE_TYPES.includes(file.type)),
            "Only image file types are allowed"
        ),
});

export type EventFormData = z.infer<typeof eventSchema>;

// Extended type for internal form handling, including images to delete
export interface ExtendedEventFormData extends EventFormData {
    _imagesToDelete?: string[];
} 