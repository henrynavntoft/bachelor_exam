import { z } from 'zod';

// Schema for creating an event
export const createEventSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    description: z.string().min(1, { message: 'Description is required' }),
    images: z.array(z.string().url({ message: 'Each image must be a valid URL' })).optional(),
    date: z.coerce.date({ invalid_type_error: 'Invalid date' }),
    location: z.string().min(1, { message: 'Location is required' }),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

// Schema for updating an event (all fields optional)
export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

// Schema for route params
export const eventIdParamSchema = z.object({
    id: z.string().uuid({ message: 'Invalid event ID' }),
});
export type EventIdParam = z.infer<typeof eventIdParamSchema>;