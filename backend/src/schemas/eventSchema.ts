import { z } from 'zod';
import { EventType } from '@prisma/client';

// Create a Zod enum from the Prisma EventType enum
const eventTypeEnum = z.nativeEnum(EventType);

// Schema for creating event images
export const createEventImageSchema = z.object({
    imageUrl: z.string().url({ message: 'Must be a valid image URL' }),
    altText: z.string().optional(),
    order: z.number().int().nonnegative({ message: 'Order must be a non-negative integer' }).default(0),
});
export type CreateEventImageInput = z.infer<typeof createEventImageSchema>;

// Schema for updating event images
export const updateEventImageSchema = createEventImageSchema.partial();
export type UpdateEventImageInput = z.infer<typeof updateEventImageSchema>;

// Schema for creating an event
export const createEventSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    description: z.string().min(1, { message: 'Description is required' }),
    // images: z.array(createEventImageSchema).optional(), // Will be handled via separate endpoint
    date: z.coerce.date({ invalid_type_error: 'Invalid date' })
        .refine(
            (date) => date > new Date(),
            { message: 'Event date must be in the future' }
        ),
    location: z.string().min(1, { message: 'Location is required' }),
    pricePerPerson: z.coerce.number().positive({ message: "Price must be a positive number" }).optional().nullable(),
    eventType: eventTypeEnum,
    capacity: z.number().int().positive({ message: "Capacity must be a positive integer" }).optional().nullable(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

// Schema for updating an event (all fields optional)
export const updateEventSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }).optional(),
    description: z.string().min(1, { message: 'Description is required' }).optional(),
    // For updates, only validate date if it's being provided
    date: z.coerce.date({ invalid_type_error: 'Invalid date' })
        .refine(
            (date) => date > new Date(),
            { message: 'Event date must be in the future' }
        )
        .optional(),
    location: z.string().min(1, { message: 'Location is required' }).optional(),
    pricePerPerson: z.coerce.number().positive({ message: "Price must be a positive number" }).optional().nullable(),
    eventType: eventTypeEnum.optional(),
    capacity: z.number().int().positive({ message: "Capacity must be a positive integer" }).optional().nullable(),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// Schema for route params
export const eventIdParamSchema = z.object({
    id: z.string().uuid({ message: 'Invalid event ID' }),
});
export type EventIdParam = z.infer<typeof eventIdParamSchema>;