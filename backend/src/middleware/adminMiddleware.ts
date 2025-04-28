import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied.' });
        return;
    }
    next();
};

export const requireHost = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'HOST') {
        res.status(403).json({ error: 'Access denied.' });
        return;
    }
    next();
};

export const requireGuest = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'GUEST') {
        res.status(403).json({ error: 'Access denied.' });
        return;
    }
    next();
};