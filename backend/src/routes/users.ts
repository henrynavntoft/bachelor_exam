import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { ZodError, ZodIssue } from 'zod';
import { userIdParamSchema, UserIdParam, updateUserSchema, UpdateUserInput } from '../schemas/userSchema';

const router = Router();

// GET all users (Admin only)
router.get('/', authenticateJWT(['ADMIN']), requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({ where: { isDeleted: false } });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
        return;
    }
});

// Get a single user by ID
router.get('/:id', authenticateJWT(['ADMIN']), requireRole('ADMIN'), async (req: Request, res: Response) => {
    // Validate ID param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { id } = params;

    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
        return;
    }
});

// Update a user
router.put('/:id', authenticateJWT(['ADMIN']), requireRole('ADMIN'), async (req: Request, res: Response) => {
    // Validate ID param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { id } = params;

    // Validate body
    let body: UpdateUserInput;
    try {
        body = updateUserSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { firstName, lastName, email } = body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { firstName, lastName, email },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
        return;
    }
});

// Delete a user
router.delete('/:id', authenticateJWT(['ADMIN']), requireRole('ADMIN'), async (req: Request, res: Response) => {
    // Validate ID param
    let params: UserIdParam;
    try {
        params = userIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { id } = params;

    try {
        await prisma.user.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
        return;
    }
});


export default router;