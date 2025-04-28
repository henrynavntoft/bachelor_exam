import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Get all events
router.get('/', (async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany();
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
router.post('/', (async (req: Request, res: Response) => {
    const { title, description, images, date, location, hostId } = req.body;
    try {
        const event = await prisma.event.create({
            data: { title, description, images, date: new Date(date), location, hostId },
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Failed to create event' });
    }
}) as RequestHandler);

// Update an event
router.put('/:id', (async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, images, date, location } = req.body;
    try {
        const event = await prisma.event.update({
            where: { id },
            data: { title, description, images, date: new Date(date), location },
        });
        res.status(200).json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Failed to update event' });
    }
}) as RequestHandler);

// Delete an event
router.delete('/:id', (async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.event.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Failed to delete event' });
    }
}) as RequestHandler);

export default router;