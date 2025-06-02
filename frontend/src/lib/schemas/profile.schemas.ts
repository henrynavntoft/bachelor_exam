import { z } from 'zod';

export const profileSchema = z.object({
    firstName: z.string().min(2, "First name requires at least 2 characters"), // Adjusted min length for consistency
    lastName: z.string().min(2, "Last name requires at least 2 characters"),  // Adjusted min length
    profilePicture: z.union([
        z.instanceof(File),
        z.string(),       // For existing URL
        z.null(),         // Explicitly allow null if picture is removed/not set
        z.undefined(),
    ]).optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>; 