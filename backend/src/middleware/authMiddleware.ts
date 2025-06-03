import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { prisma } from '../config/prisma';
import { eventIdParamSchema } from '../schemas/eventSchema'; // Assuming this validates { id: string }
import { ZodError, ZodIssue } from 'zod';
import { Role } from '@prisma/client';
import { z } from 'zod';

// include SELF for user-own resources, EVENT_OWNER for event ownership
export type AuthRole = Role | 'SELF' | 'EVENT_OWNER';

interface DecodedUser extends JwtPayload {
    userId: string; // Assuming your JWT payload includes the user's ID as userId
    role: Role; // Assuming your JWT payload includes the user's role
}

export interface AuthenticatedRequest extends Request {
    user?: DecodedUser; // Attach the decoded user to the request object
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    // Ideally, this check happens once at application startup
    console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
    process.exit(1); // Or handle this error appropriately during startup
}
const isProduction = process.env.RTE === 'prod'; // Use RTE for production

// Standard options for the authToken cookie
const AUTH_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true, // Prevent client-side JavaScript access
    secure: isProduction, // Only send over HTTPS in production
    sameSite: isProduction ? 'none' : 'lax', // 'none' requires secure: true
    path: '/', // Available across the whole site
};

/**
 * Clear the authToken cookie and reset auth-related locals
 */
const clearAuthState = (res: Response): void => {
    // Setting a short expiry time is a common way to clear a cookie
    res.cookie('authToken', '', { ...AUTH_COOKIE_OPTIONS, expires: new Date(0) });
    // Alternative using clearCookie, potentially cleaner:
    // res.clearCookie('authToken', AUTH_COOKIE_OPTIONS); // Ensure options match setCookie
    res.locals.isLoggedIn = false;
    res.locals.role = null;
    // Clear user from request object as well
    // delete (res as AuthenticatedRequest).user; // This might require casting
};

//////////////////////////////////////////////////////////////////////////////////
/**
 * Authentication & Authorization middleware
 * Checks for JWT, authenticates user, and authorizes based on specified roles or ownership.
 * @param roles Array of roles or 'SELF'/'EVENT_OWNER' to permit the resource owner. Empty array means authentication is optional.
 */
export const authorize = (roles: AuthRole[] = []) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const token = req.cookies?.authToken;
        const authRequired = roles.length > 0; // Is authorization required for this route?

        if (!token) {
            clearAuthState(res);
            if (authRequired) {
                // If token is required but not present
                res.status(401).json({ message: 'Authentication token required.' });
            } else {
                // If auth is optional, just proceed with unauthenticated state
                next();
            }
            return;
        }

        try {
            // Verify the token
            const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
            req.user = decoded; // Attach authenticated user to request
            res.locals.isLoggedIn = true;
            res.locals.role = decoded.role;

            // --- Authorization Logic ---

            // If no specific roles or ownership are required, authentication is enough.
            if (!authRequired) {
                return next();
            }

            let isAuthorized = false; // Flag to track if any authorization condition is met

            // 1. ADMIN Override: Admins are always authorized if authentication succeeds
            if (decoded.role === 'ADMIN') {
                isAuthorized = true;
            }

            // 2. SELF Ownership Check (e.g., user profile)
            const allowSelf = roles.includes('SELF');
            if (!isAuthorized && allowSelf) {
                // Ensure id param exists and matches authenticated user's ID
                if (req.params.id && typeof req.params.id === 'string' && req.params.id === decoded.userId) {
                    isAuthorized = true;
                }
            }

            // 3. EVENT_OWNER Ownership Check (e.g., modifying an event)
            const allowEventOwner = roles.includes('EVENT_OWNER');
            if (!isAuthorized && allowEventOwner) {
                // Try to get event ID from either id or eventId parameter
                let eventId: string | undefined;
                
                // First try req.params.id (for regular event routes)
                if (req.params.id) {
                    try {
                        const params = eventIdParamSchema.parse(req.params);
                        eventId = params.id;
                    } catch (err: unknown) {
                        // If id param is invalid, check eventId param
                        if (req.params.eventId) {
                            try {
                                const eventIdSchema = z.object({
                                    eventId: z.string().uuid({ message: 'Invalid event ID' })
                                });
                                const params = eventIdSchema.parse(req.params);
                                eventId = params.eventId;
                            } catch (eventIdErr: unknown) {
                                if (eventIdErr instanceof ZodError) {
                                    const message = eventIdErr.errors.map((i: ZodIssue) => i.message).join(', ');
                                    res.status(400).json({ message: `Invalid parameter: ${message}` });
                                    return;
                                }
                                throw eventIdErr;
                            }
                        } else {
                            if (err instanceof ZodError) {
                                const message = err.errors.map((i: ZodIssue) => i.message).join(', ');
                                res.status(400).json({ message: `Invalid parameter: ${message}` });
                                return;
                            }
                            throw err;
                        }
                    }
                }
                // If no id param, try eventId param (for event-images routes)
                else if (req.params.eventId) {
                    try {
                        const eventIdSchema = z.object({
                            eventId: z.string().uuid({ message: 'Invalid event ID' })
                        });
                        const params = eventIdSchema.parse(req.params);
                        eventId = params.eventId;
                    } catch (err: unknown) {
                        if (err instanceof ZodError) {
                            const message = err.errors.map((i: ZodIssue) => i.message).join(', ');
                            res.status(400).json({ message: `Invalid parameter: ${message}` });
                            return;
                        }
                        throw err;
                    }
                }

                if (eventId) {
                    // Find the event and check if the authenticated user is the host
                    const event = await prisma.event.findUnique({ where: { id: eventId } });
                    if (event && event.hostId === decoded.userId) {
                        isAuthorized = true;
                    }
                }
                // Note: If event is not found, or user is not host, isAuthorized remains false.
                // The final check will handle denying access if needed.
            }

            // 4. Role-Based Check (e.g., 'HOST' for creating events)
            // Exclude SELF and EVENT_OWNER from the roles array for this check
            const allowedRoles = roles.filter((r): r is Role => r !== 'SELF' && r !== 'EVENT_OWNER');
            if (!isAuthorized && allowedRoles.length > 0) {
                if (allowedRoles.includes(decoded.role)) {
                    isAuthorized = true;
                }
            }

            // --- Final Decision ---

            if (isAuthorized) {
                // User is authenticated and meets at least one required authorization condition
                next();
            } else {
                // User is authenticated but does NOT meet any required authorization condition
                console.warn(`Authorization denied for user ${decoded.userId} (Role: ${decoded.role}) on route ${req.method} ${req.path}. Required: [${roles.join(', ')}]`);
                res.status(403).json({ message: 'Forbidden' });
            }

        } catch (error) {
            // Handle JWT verification failures (expired, invalid signature, etc.)
            console.error('JWT verification failed:', error instanceof Error ? error.message : error);
            clearAuthState(res); // Clear potentially invalid token
            if (authRequired) {
                // If auth was required, respond with unauthorized
                res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
            } else {
                // If auth was optional, just clear state and proceed
                next();
            }
        }
    };
};