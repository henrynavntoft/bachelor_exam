import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { createRatingSchema, CreateRatingInput, userIdParamSchema, UserIdParam } from '../schemas/ratingSchema';
import { ZodError, ZodIssue } from 'zod';

const router = Router();

// POST: Create a new rating for a user
router.post('/users/:userId/ratings', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    // Validate userId param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { userId: ratedUserId } = params;

    // Validate body
    let body: CreateRatingInput;
    try {
        body = createRatingSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { rating, comment, eventId } = body;
    const raterUserId = req.user?.userId;

    if (!raterUserId) {
        res.status(401).json({ message: 'Unauthorized. User ID not found in token.' });
        return;
    }

    if (raterUserId === ratedUserId) {
        res.status(400).json({ message: 'You cannot rate yourself.' });
        return;
    }

    try {
        // Check if the user to be rated exists
        const ratedUserExists = await prisma.user.findUnique({
            where: { id: ratedUserId },
            select: { id: true }
        });
        if (!ratedUserExists) {
            res.status(404).json({ message: 'User to be rated not found.' });
            return;
        }

        // Check if this rater has already rated this user for this event
        const existingRating = await prisma.rating.findUnique({
            where: {
                ratedUserId_raterUserId_eventId: {
                    ratedUserId: ratedUserId,
                    raterUserId: raterUserId,
                    eventId: eventId
                }
            }
        });

        if (existingRating) {
            res.status(409).json({ message: 'You have already rated this user for this event.' });
            return;
        }

        // 1. Check event exists and is in the past
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { date: true, hostId: true }
        });
        if (!event) {
            res.status(404).json({ message: 'Event not found.' });
            return;
        }
        if (event.date > new Date()) {
            res.status(400).json({ message: 'You can only rate users for events that have already occurred.' });
            return;
        }

        // 2. Check both rater and rated user attended (or hosted) the event
        // Host is always allowed to rate and be rated for their event
        const attendees = await prisma.attendee.findMany({
            where: { eventId },
            select: { userId: true }
        });
        const attendeeIds = attendees.map(a => a.userId);
        const raterIsHost = raterUserId === event.hostId;
        const ratedIsHost = ratedUserId === event.hostId;
        const raterIsAttendee = attendeeIds.includes(raterUserId);
        const ratedIsAttendee = attendeeIds.includes(ratedUserId);
        if (!( (raterIsHost && ratedIsAttendee) || (ratedIsHost && raterIsAttendee) || (raterIsAttendee && ratedIsAttendee) )) {
            res.status(400).json({ message: 'Both users must have attended (or hosted) the event to rate each other.' });
            return;
        }

        const newRating = await prisma.rating.create({
            data: {
                rating,
                comment,
                ratedUserId,
                raterUserId,
                eventId,
            },
            include: { // Optionally include related data, e.g., rater or rated user info
                raterUser: {
                    select: { id: true, firstName: true, lastName: true }
                },
                ratedUser: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        res.status(201).json(newRating);
    } catch (error) {
        console.error('Error creating rating:', error);
        // Consider more specific error handling, e.g., for Prisma unique constraint violations if not handled above
        res.status(500).json({ message: 'Failed to create rating.' });
    }
});

// GET: Get all ratings for a specific user
router.get('/users/:userId/ratings', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    // Validate userId param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { userId: ratedUserId } = params;

    try {
        // Check if the user exists
        const userExists = await prisma.user.findUnique({
            where: { id: ratedUserId },
            select: { id: true }
        });
        if (!userExists) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        const ratings = await prisma.rating.findMany({
            where: { ratedUserId },
            include: {
                raterUser: { // Information about the user who gave the rating
                    select: { id: true, firstName: true, lastName: true, profilePicture: true }
                },
                event: { // Information about the event for which the rating was given
                    select: { id: true, title: true, date: true }
                }
                // Optionally, do not include ratedUser here as it's redundant (it's the user whose ratings are being fetched)
            },
            orderBy: {
                createdAt: 'desc' // Show newest ratings first
            }
        });

        res.status(200).json(ratings);
    } catch (error) {
        console.error('Error fetching ratings for user:', error);
        res.status(500).json({ message: 'Failed to fetch ratings.' });
    }
});

// GET: Get average rating for a specific user
router.get('/users/:userId/ratings/average', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    // Validate userId param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { userId: ratedUserId } = params;

    try {
        // Check if the user exists
        const userExists = await prisma.user.findUnique({
            where: { id: ratedUserId },
            select: { id: true }
        });
        if (!userExists) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        const result = await prisma.rating.aggregate({
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
            where: { ratedUserId },
        });

        res.status(200).json({
            averageRating: result._avg.rating !== null ? parseFloat(result._avg.rating.toFixed(2)) : null, // Format to 2 decimal places
            ratingCount: result._count.rating,
        });
    } catch (error) {
        console.error('Error fetching average rating for user:', error);
        res.status(500).json({ message: 'Failed to fetch average rating.' });
    }
});

// GET: Get all ratings given by a specific user
router.get('/users/:userId/ratings/given', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    // Validate userId param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { userId: raterUserId } = params;

    try {
        // Check if the user exists
        const userExists = await prisma.user.findUnique({
            where: { id: raterUserId },
            select: { id: true }
        });
        if (!userExists) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        const ratingsGiven = await prisma.rating.findMany({
            where: { raterUserId },
            include: {
                ratedUser: { // Information about the user who received the rating
                    select: { id: true, firstName: true, lastName: true, profilePicture: true }
                },
                event: { // Information about the event for which the rating was given
                    select: { id: true, title: true, date: true }
                }
            },
            orderBy: {
                createdAt: 'desc' // Show newest ratings first
            }
        });

        res.status(200).json(ratingsGiven);
    } catch (error) {
        console.error('Error fetching ratings given by user:', error);
        res.status(500).json({ message: 'Failed to fetch ratings given.' });
    }
});

// Future routes for fetching ratings will go here

export default router; 