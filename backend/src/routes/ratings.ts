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
    const { rating, comment } = body;
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

        // Check if this rater has already rated this user
        const existingRating = await prisma.rating.findUnique({
            where: {
                ratedUserId_raterUserId: {
                    ratedUserId: ratedUserId,
                    raterUserId: raterUserId
                }
            }
        });

        if (existingRating) {
            res.status(409).json({ message: 'You have already rated this user.' });
            return;
        }

        const newRating = await prisma.rating.create({
            data: {
                rating,
                comment,
                ratedUserId,
                raterUserId,
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

// Future routes for fetching ratings will go here

export default router; 