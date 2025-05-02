import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { CookieOptions } from 'express';

// Supported user roles for authorization
export type Role = 'ADMIN' | 'HOST' | 'GUEST';

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

// Standard options for the authToken cookie
const AUTH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
};

/**
 * Clear the authToken cookie and reset auth-related locals
 */
const clearAuthState = (res: Response): void => {
    res.clearCookie('authToken', AUTH_COOKIE_OPTIONS);
    res.locals.isLoggedIn = false;
    res.locals.role = null;
};

//////////////////////////////////////////////////////////////////////////////////
/**
 * Authentication & Authorization middleware
 * @param roles Optional array of roles. If empty, only authentication is enforced.
 * @param allowSelf  Whether a user can access their own resource (by matching req.params.id to userId)
 */
export const authorize = (roles: Role[] = [], allowSelf: boolean = false) => {
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
            // Allow self-access if enabled and params.id matches userId
            if (
                allowSelf &&
                typeof req.params.id === 'string' &&
                req.params.id === decoded.userId
            ) {
                return next();
            }

            // Fallback role check after self-access check
            if (roles.length > 0 && !roles.includes(decoded.role as Role)) {
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
