import { z } from 'zod';

// Param schema for user ID (expects a UUID)
export const userIdParamSchema = z.object({
    id: z.string().uuid({ message: 'Invalid user ID' }),
});
export type UserIdParam = z.infer<typeof userIdParamSchema>;

// Body schema for updating a user
export const updateUserSchema = z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
