

import { z } from 'zod';

// Schema for delete upload request
export const deleteSchema = z.object({
    key: z.union([z.string(), z.array(z.string())]),
});
export type DeleteInput = z.infer<typeof deleteSchema>;