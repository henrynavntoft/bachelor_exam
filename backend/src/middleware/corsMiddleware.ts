import cors from 'cors';

// Allowed origins list from environment
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

//////////////////////////////////////////////////////////////////////////////////
// Middleware to handle CORS
// This middleware checks the origin of incoming requests and allows or denies them based on the allowed origins.
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
});