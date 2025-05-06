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
    // Validate ID param (Still need this validation, even if middleware also does it for EVENT_OWNER check)
    let params: EventIdParam; // Note: Your middleware handles Zod errors for eventIdParamSchema
    try {
        params = eventIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            // Middleware might have already sent this for EVENT_OWNER. Safe to keep for robustness.
            if (!res.headersSent) {
                res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            }
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
        // REDUNDANT FETCH REMOVED:
        // const event = await prisma.event.findUnique({ where: { id } });
        // if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
        // authorize(['EVENT_OWNER']) ensures the event exists and req.user is the owner (or admin)

        // Build partial update payload
        const updateData: {
            title?: string;
            description?: string;
            images?: string[];
            date?: Date;
            location?: string;
        } = {};
        // Only add fields if they are present in the validated body (handle potential undefined/null based on schema)
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        // Check your schema for images - allow null or just array?
        if (images !== undefined) updateData.images = images;
        if (date !== undefined) updateData.date = new Date(date); // Ensure date is handled consistently
        if (location !== undefined) updateData.location = location;


        // Add a check if updateData is empty? If the body was empty {} and schema allows it.
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({ message: 'No update data provided.' });
            return;
        }


        await prisma.event.update({
            where: { id },
            data: updateData,
        });

        // It's often better to return the updated resource rather than a string
        // You could fetch the updated event or just return 200 with a success message
        res.status(200).json({ message: "Event updated successfully" }); // Or fetch and return the event

    } catch (error) {
        console.error('Error updating event:', error);
        // Consider checking error type for specific database errors vs others
        res.status(500).json({ message: 'Failed to update event' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// DELETE: Delete an event
router.delete('/:id', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    // Validate ID param (Again, middleware might handle Zod errors, but robust here)
    let params: EventIdParam;
    try {
        params = eventIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            if (!res.headersSent) {
                res.status(400).json({ error: `Invalid parameter: ${errorMessage}` });
            }
            return;
        }
        throw err;
    }
    const { id } = params;

    try {

        await prisma.event.update({
            where: { id },
            data: { isDeleted: true }, // soft delete!
        });

        res.status(204).send(); // 204 No Content is standard for successful DELETE with no response body

    } catch (error) {
        console.error('Error deleting event:', error);
        // Consider checking error type
        res.status(500).json({ message: 'Failed to delete event' });
    }
});
export default router;