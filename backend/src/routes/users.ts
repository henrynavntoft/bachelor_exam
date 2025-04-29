import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const prisma = new PrismaClient();
const router = Router();

// GET all users (Admin only)
router.get('/', authenticateJWT(['ADMIN']), requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({ where: { isDeleted: false } });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
    }
});

// Get a single user by ID
router.get('/:id', authenticateJWT(['ADMIN']), requireAdmin, (async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
}) as RequestHandler);

// Update a user
router.put('/:id', authenticateJWT(['ADMIN']), requireAdmin, (async (req: Request, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { firstName, lastName, email },
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
}) as RequestHandler);

// Delete a user
router.delete('/:id', authenticateJWT(['ADMIN']), requireAdmin, (async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.user.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
}) as RequestHandler);


export default router;