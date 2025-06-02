import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { Role } from '@prisma/client';

//////////////////////////////////////////////////////////////////////////////////
// Middleware to check user role
// This middleware checks if the authenticated user has the required role.
// If the user does not have the required role, it sends a 403 Forbidden response.
export const requireRole = (role: Role): RequestHandler => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.role !== role) {
            res.status(403).json({ error: 'Access denied.' });
            return;
        }
        next();
    };
};