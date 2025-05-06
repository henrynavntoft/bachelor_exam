import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ZodError, ZodIssue } from 'zod';
import { userIdParamSchema, UserIdParam, updateUserSchema, UpdateUserInput } from '../schemas/userSchema';

const router = Router();

//////////////////////////////////////////////////////////////////////////////////
// GET: Get all users
router.get('/', authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
        return;
    }
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Get a single user by ID
router.get('/:id', authorize(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
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

//////////////////////////////////////////////////////////////////////////////////
// PUT: Update a user
router.put('/:id', authorize(['ADMIN', 'SELF']), async (req: AuthenticatedRequest, res: Response) => {
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
    const { firstName, lastName, email, isDeleted } = body;

    // Check if user is trying to update isDeleted without admin privileges
    if (isDeleted !== undefined && req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Only administrators can update the isDeleted field' });
        return;
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                ...(isDeleted !== undefined && req.user?.role === 'ADMIN' ? { isDeleted } : {}),
            },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
        return;
    }
});

//////////////////////////////////////////////////////////////////////////////////
// DELETE: Delete a user
router.delete('/:id', authorize(['ADMIN', 'SELF']), async (req: AuthenticatedRequest, res: Response) => {
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
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
        return;
    }
});


export default router;