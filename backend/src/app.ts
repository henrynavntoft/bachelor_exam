import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import authRoutes from './routes/auth';
import uploadRoute from './routes/upload';
import ratingsRouter from './routes/ratings';
import { authLimiter, generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/headerMiddleware';
import { corsMiddleware } from './middleware/corsMiddleware';
import { loggingMiddleware } from './middleware/loggingMiddleware';

dotenv.config({ path: './.env' });

const app: Express = express();
if (process.env.RTE === 'prod') {
    app.set('trust proxy', 1);
}

app.use(generalLimiter);
app.use(securityMiddleware);
app.use(loggingMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(corsMiddleware);


app.get('/', (req: Request, res: Response) => {
    res.send('Server is running');
});

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/users', ratingsRouter);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;