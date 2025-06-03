import { z } from 'zod';

// Param schema for user ID (expects a UUID)
export const userIdParamSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
});
export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Body schema for updating a user
export const updateUserSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    isDeleted: z.boolean().optional(),
    profilePicture: z.string().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
