import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: [
        process.env.RTE !== 'prod' ? 'query' : 'warn',
        'error',
    ],
});