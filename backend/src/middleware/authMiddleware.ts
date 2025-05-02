import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface DecodedUser extends JwtPayload {
    userId: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: DecodedUser;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not defined.');
const isProduction = process.env.RTE === 'prod';

const clearAuthState = (res: Response) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
    });
    res.locals.isLoggedIn = false;
    res.locals.role = null;
};

// Authentication middleware
export const authenticateJWT = (roles: string[] = []) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
