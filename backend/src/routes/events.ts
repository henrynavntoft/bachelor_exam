import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireHost } from '../middleware/adminMiddleware';
const prisma = new PrismaClient();
const router = Router();

// Get all events
router.get('/', (async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({ where: { isDeleted: false } });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
}) as RequestHandler);

// Get a single event by ID
router.get('/:id', (async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Failed to fetch event' });
    }
}) as RequestHandler);

// Create a new event
router.post('/', authenticateJWT(['HOST']), requireHost, (async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, images, date, location } = req.body;
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const event = await prisma.event.create({
            data: { title, description, images, date: new Date(date), location, hostId: req.user.userId },
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Failed to create event' });
    }
}) as RequestHandler);

// Update an event
router.put('/:id', authenticateJWT(['HOST']), requireHost, (async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, images, date, location } = req.body;
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.hostId !== req.user?.userId) {
            return res.status(403).json({ message: 'Forbidden: You can only update your own events.' });
        }
        const updatedEvent = await prisma.event.update({
            where: { id },
            data: { title, description, images, date: new Date(date), location },
        });
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Failed to update event' });
    }
}) as RequestHandler);

// Delete an event
router.delete(
    '/:id',
    authenticateJWT(['HOST', 'ADMIN']),
    (async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
        try {
            const event = await prisma.event.findUnique({ where: { id } });

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            // If user is HOST, check ownership
            if (req.user?.role === 'HOST' && event.hostId !== req.user?.userId) {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own events.' });
            }

            // If ADMIN, no extra checks needed - can delete any event
            await prisma.event.update({
                where: { id },
                data: { isDeleted: true }, // soft delete!
            });

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ message: 'Failed to delete event' });
        }
    }) as RequestHandler
);

export default router;