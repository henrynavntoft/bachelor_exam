import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export const requireRole = (role: 'ADMIN' | 'HOST' | 'GUEST'): RequestHandler => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.role !== role) {
            res.status(403).json({ error: 'Access denied.' });
            return;
        }
        next();
    };
};