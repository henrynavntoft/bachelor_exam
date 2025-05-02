import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import authRoutes from './routes/auth';
import uploadRoute from './routes/upload';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { attachCSRFToken, validateCSRFToken } from './middleware/csrfMiddleware';


dotenv.config({ path: './.env' });

const app: Express = express();

app.use(generalLimiter);

app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(attachCSRFToken);

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.get('/', (req: Request, res: Response) => {
    res.send('Server is running');
});

app.use('/api/users', validateCSRFToken, userRoutes);
app.use('/api/events', validateCSRFToken, eventRoutes);
app.use('/api/auth', validateCSRFToken, authRoutes);
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