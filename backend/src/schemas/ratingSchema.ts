import { z } from 'zod';

// Schema for creating a rating
export const createRatingSchema = z.object({
    rating: z.number().int({ message: 'Rating must be an integer.' })
        .min(1, { message: 'Rating must be at least 1.' })
        .max(10, { message: 'Rating cannot exceed 10.' }),
    comment: z.string().optional(),
    eventId: z.string().uuid({ message: 'Invalid event ID format for rating.' }),
});
export type CreateRatingInput = z.infer<typeof createRatingSchema>;

// Schema for route params when a user ID is expected
export const userIdParamSchema = z.object({
    userId: z.string().uuid({ message: 'Invalid user ID format.' }),
});
export type UserIdParam = z.infer<typeof userIdParamSchema>; 