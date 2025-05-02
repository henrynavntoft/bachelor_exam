import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { prisma } from '../config/prisma';
import { eventIdParamSchema } from '../schemas/eventSchema';
import { ZodError, ZodIssue } from 'zod';

// Supported user roles for authorization
export type Role = 'ADMIN' | 'HOST' | 'GUEST';
// include SELF for user-own resources, EVENT_OWNER for event ownership
export type AuthRole = Role | 'SELF' | 'EVENT_OWNER';

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
 * @param roles Array of roles or 'SELF' to permit the resource owner.
 */
export const authorize = (roles: AuthRole[] = []) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const token = req.cookies?.authToken;
        // Determine if resource-owner access is allowed
        const allowSelf = roles.includes('SELF');
        const allowedRoles = roles.filter((r): r is Role => r !== 'SELF' && r !== 'EVENT_OWNER');
        const allowEventOwner = roles.includes('EVENT_OWNER');

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
            // Allow self-access when 'SELF' is specified
            if (
                allowSelf &&
                typeof req.params.id === 'string' &&
                req.params.id === decoded.userId
            ) {
                return next();
            }
            // Allow event-owner access when 'EVENT_OWNER' is specified
            if (allowEventOwner) {
                // validate and parse event ID
                let params;
                try {
                    params = eventIdParamSchema.parse(req.params);
                } catch (err: unknown) {
                    if (err instanceof ZodError) {
                        const message = err.errors.map((i: ZodIssue) => i.message).join(', ');
                        res.status(400).json({ message });
                        return;
                    }
                    throw err;
                }
                const event = await prisma.event.findUnique({ where: { id: params.id } });
                if (event && event.hostId === decoded.userId) {
                    return next();
                }
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            // Role-based check for non-self access
            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role as Role)) {
                console.warn('Unauthorized access attempt by user with role:', decoded.role);
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            // Final ADMIN override (only if no event ownership was required or checked)
            if (decoded.role === 'ADMIN') {
                return next();
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
