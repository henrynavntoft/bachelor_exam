import { createEventSchema, updateEventSchema, eventIdParamSchema, CreateEventInput, UpdateEventInput, EventIdParam } from '../schemas/eventSchema';
import { ZodError, ZodIssue } from 'zod';
import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
const router = Router();


//////////////////////////////////////////////////////////////////////////////////
// GET: Get all events
router.get('/', async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({ where: { isDeleted: false } });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Get a single event by ID
router.get('/:id', async (req: Request, res: Response) => {
    // Validate ID param
    let params: { id: string };
    try {
        params = eventIdParamSchema.parse(req.params);
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
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Failed to fetch event' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Create a new event
router.post('/', authorize(['HOST']), async (req: AuthenticatedRequest, res: Response) => {
    // Validate body
    let body: CreateEventInput;
    try {
        body = createEventSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { title, description, images, date, location } = body;
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const event = await prisma.event.create({
            data: { title, description, images, date: new Date(date), location, hostId: req.user.userId },
        });
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Failed to create event' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// PUT: Update an event
router.put('/:id', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    // Validate ID param
    let params: EventIdParam;
    try {
        params = eventIdParamSchema.parse(req.params);
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
    let body: UpdateEventInput;
    try {
        body = updateEventSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        throw err;
    }
    const { title, description, images, date, location } = body;
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }
        // Removed manual ownership check as verifyEventOwner handles it

        // Build partial update payload
        const updateData: {
            title?: string;
            description?: string;
            images?: string[];
            date?: Date;
            location?: string;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (images !== undefined) updateData.images = images;
        if (date !== undefined) updateData.date = date;  // already a Date from Zod coercion
        if (location !== undefined) updateData.location = location;

        await prisma.event.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json("Event updated successfully");
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Failed to update event' });
    }
}
);

//////////////////////////////////////////////////////////////////////////////////
// DELETE: Delete an event
router.delete('/:id', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    // Validate ID param
    let params: EventIdParam;
    try {
        params = eventIdParamSchema.parse(req.params);
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
        const event = await prisma.event.findUnique({ where: { id } });

        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        // Removed manual host/role check as verifyEventOwner handles it

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
}
);

export default router;