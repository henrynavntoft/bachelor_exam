import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import authRoutes from './routes/auth';
import uploadRoute from './routes/upload';
import { authLimiter, generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/headerMiddleware';
import { attachCSRFToken, validateCSRFToken } from './middleware/csrfMiddleware';
import { corsMiddleware } from './middleware/corsMiddleware';
import { loggingMiddleware } from './middleware/loggingMiddleware';



dotenv.config({ path: './.env' });

const app: Express = express();
// Trust reverse proxies (e.g. Nginx) so rate-limit and CSRF middleware see correct headers
app.set('trust proxy', true);

app.use(generalLimiter);
app.use(securityMiddleware);
app.use(loggingMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(corsMiddleware);
app.use(attachCSRFToken);

app.get('/', (req: Request, res: Response) => {
    res.send('Server is running');
});

app.use('/api/users', validateCSRFToken, userRoutes);
app.use('/api/events', validateCSRFToken, eventRoutes);
app.use('/api/auth', validateCSRFToken, authLimiter, authRoutes);
app.use('/api/upload', validateCSRFToken, uploadRoute);

app.get('/api/csrf-token', (req: Request, res: Response): void => {
    const signedToken = req.cookies['csrf-token'];
    if (!signedToken) {
        res.status(403).json({ message: 'No CSRF token found' });
        return;
    }
    const [token] = signedToken.split('.');
    res.json({ csrfToken: token });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;