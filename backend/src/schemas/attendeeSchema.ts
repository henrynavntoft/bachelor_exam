import { z } from 'zod';

export const attendEventSchema = z.object({
    quantity: z.number().int().positive({ message: "Quantity must be a positive integer." }).default(1),
});
export type AttendEventInput = z.infer<typeof attendEventSchema>; 