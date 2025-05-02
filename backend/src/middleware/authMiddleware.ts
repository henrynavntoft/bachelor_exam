import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface DecodedUser extends JwtPayload {
    userId: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: DecodedUser;
}

// Authentication middleware
export const authenticateJWT = (roles: string[] = []) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not defined.');
            res.status(500).json({ message: 'Internal server error' });
            return;
        }

        const clearAuthState = (res: Response) => {
            res.clearCookie('authToken');
            res.locals.isLoggedIn = false;
            res.locals.role = null;
        };

        const token = req.cookies?.authToken;

        if (!token) {
            clearAuthState(res);
            if (roles.length > 0) {
                res.status(401).json({ message: 'Unauthorized' });
            } else {
                next();
            }
            return;
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
            req.user = decoded;
            res.locals.isLoggedIn = true;
            res.locals.role = decoded.role;

            if (roles.length > 0 && !roles.includes(decoded.role)) {
                console.warn('Unauthorized access attempt by user with role:', decoded.role);
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            next();
        } catch (error) {
            console.error('JWT verification failed:', error);
            clearAuthState(res);
            if (roles.length > 0) {
                res.status(401).json({ message: 'Unauthorized' });
            } else {
                next();
            }
        }
    };
};
