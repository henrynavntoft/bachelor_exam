import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import userRoutes from '../src/routes/users';
import eventRoutes from '../src/routes/events';
import authRoutes from '../src/routes/auth';
import uploadRoute from './routes/upload';


dotenv.config({ path: './.env' });

const app: Express = express();

// Middlewares
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Meet & Greet Backend Running');
});

app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoute);
////////////////////////////////////////////////////////////////////////////////////////
// Global error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err.message);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'dev' ? err.message : undefined,
  });
  next();
}


// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});