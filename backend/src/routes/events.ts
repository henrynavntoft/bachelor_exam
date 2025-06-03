import { createEventSchema, updateEventSchema, eventIdParamSchema, CreateEventInput, UpdateEventInput, EventIdParam } from '../schemas/eventSchema';
import { attendEventSchema, AttendEventInput } from '../schemas/attendeeSchema';
import { ZodError, ZodIssue } from 'zod';
import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { EventType } from '@prisma/client';
const router = Router();


//////////////////////////////////////////////////////////////////////////////////
// GET: Get all events with pagination
router.get('/', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 6; // Default to 6 items per page
        const cursor = req.query.cursor as string | undefined; // Cursor for pagination
        const includePast = req.query.includePast === 'true'; // Include past events if requested

        // Get today's date with time set to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Query parameters for filtering (can be extended later)
        const where: Prisma.EventWhereInput = {
            isDeleted: false,
        };

        // Only filter by date if we don't want to include past events
        if (!includePast) {
            where.date = {
                gte: today
            };
        }

        // Add cursor condition if provided
        const skip = cursor ? 1 : 0; // Skip the cursor item if we have one
        const cursorObj = cursor ? { id: cursor } : undefined;

        const events = await prisma.event.findMany({
            where,
            take: limit,
            skip,
            cursor: cursorObj,
            orderBy: { date: includePast ? 'desc' : 'asc' }, // Order by date descending if including past events, ascending otherwise
            include: {
                host: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePicture: true,
                    },
                },
                attendees: true
            }
        });

        // Get the next cursor
        let nextCursor: string | undefined = undefined;
        if (events.length === limit) {
            nextCursor = events[events.length - 1].id;
        }

        res.status(200).json({
            events,
            nextCursor
        });
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
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                attendees: true,
                host: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePicture: true
                    }
                }
            }
        });
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
    const { title, description, images, date, location, pricePerPerson, eventType, capacity } = body;
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const event = await prisma.event.create({
            data: {
                title,
                description,
                images,
                date: new Date(date),
                location,
                hostId: req.user.userId,
                pricePerPerson,
                eventType,
                capacity
            },
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
    const { title, description, images, date, location, pricePerPerson, eventType, capacity } = body;

    try {
        // REDUNDANT FETCH REMOVED:
        // const event = await prisma.event.findUnique({ where: { id } });
        // if (!event) { res.status(404).json({ message: 'Event not found' }); return; }
        // authorize(['EVENT_OWNER']) ensures the event exists and req.user is the owner (or admin)

        // Build partial update payload
        const updateData: Prisma.EventUpdateInput = {};

        // Only add fields if they are present in the validated body
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (images !== undefined) updateData.images = { set: images };
        if (date !== undefined) updateData.date = new Date(date);
        if (location !== undefined) updateData.location = location;
        if (pricePerPerson !== undefined) updateData.pricePerPerson = pricePerPerson;
        if (eventType !== undefined) updateData.eventType = eventType as EventType;
        if (capacity !== undefined) updateData.capacity = capacity;

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

// RSVP to an event
router.post('/:id/attend', authorize(['GUEST']), async (req: AuthenticatedRequest, res: Response) => {
    // Validate ID param - already done by authorize if EVENT_OWNER/SELF, but good to have for GUEST
    let eventParams: EventIdParam;
    try {
        eventParams = eventIdParamSchema.parse(req.params);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid event ID: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { id: eventId } = eventParams;

    // Validate body for quantity
    let body: AttendEventInput;
    try {
        body = attendEventSchema.parse(req.body || {}); // Parse req.body, ensure object if empty for default quantity
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: `Invalid input: ${errorMessage}` });
            return;
        }
        throw err;
    }
    const { quantity } = body;

    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        // Check if event exists and get its capacity and current total quantity of attendees
        const event = await prisma.event.findUnique({
            where: { id: eventId, isDeleted: false }, // Ensure event is not deleted
            include: {
                attendees: { // Include attendees to calculate current count
                    select: { quantity: true }
                }
            }
        });

        if (!event) {
            res.status(404).json({ message: 'Event not found or has been deleted.' });
            return;
        }

        // Check capacity
        if (event.capacity !== null && event.capacity !== undefined) { // If capacity is set
            const currentTotalQuantity = event.attendees.reduce((sum, att) => sum + att.quantity, 0);
            if (currentTotalQuantity + quantity > event.capacity) {
                const spotsLeft = event.capacity - currentTotalQuantity;
                res.status(400).json({ message: `Not enough spots available. Only ${spotsLeft} spot(s) left.` });
                return;
            }
        }

        // Check if user has already RSVPed (unique constraint is on (userId, eventId) for Attendee model implicitly)
        // If a user can RSVP multiple times with different quantities, this check needs adjustment.
        // Assuming a user has only ONE Attendee record per event, which holds their total quantity.
        const existingRSVP = await prisma.attendee.findFirst({
            where: {
                userId,
                eventId,
            },
        });

        if (existingRSVP) {
            // If user wants to update quantity, they should cancel and re-RSVP, or we need an update RSVP endpoint.
            // For now, prevent new RSVP if one exists.
            res.status(400).json({ message: 'You have already RSVPed to this event. Please cancel your existing RSVP to change quantity.' });
            return;
        }

        // Create RSVP
        const rsvp = await prisma.attendee.create({
            data: {
                userId,
                eventId,
                quantity, // Store the quantity
            },
        });

        res.status(201).json(rsvp);
    } catch (error) {
        console.error('Error creating RSVP:', error);
        res.status(500).json({ message: 'Error creating RSVP' });
    }
});

// Cancel RSVP
router.delete('/:id/attend', authorize(['GUEST']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventId = req.params.id;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Check if RSVP exists
        const rsvp = await prisma.attendee.findFirst({
            where: {
                userId,
                eventId,
            },
        });

        if (!rsvp) {
            res.status(404).json({ message: 'RSVP not found' });
            return;
        }

        // Delete RSVP
        await prisma.attendee.delete({
            where: {
                id: rsvp.id,
            },
        });

        res.status(200).json({ message: 'RSVP cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        res.status(500).json({ message: 'Error cancelling RSVP' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Get all attendees for an event (including host)
router.get('/:eventId/attendees', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    const eventId = req.params.eventId;
    try {
        // Get event and host
        const event = await prisma.event.findUnique({
            where: { id: eventId, isDeleted: false },
            select: { hostId: true, host: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } }
        });
        if (!event) {
            res.status(404).json({ message: 'Event not found.' });
            return;
        }
        // Get attendees
        const attendees = await prisma.attendee.findMany({
            where: { eventId },
            include: { user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } } }
        });
        // Format attendees
        const attendeeUsers = attendees.map(a => ({ ...a.user, isHost: a.user.id === event.hostId }));
        // Add host if not already in attendees
        const hostInAttendees = attendeeUsers.some(u => u.id === event.hostId);
        let allUsers = attendeeUsers;
        if (!hostInAttendees && event.host) {
            allUsers = [{ ...event.host, isHost: true }, ...attendeeUsers];
        }
        res.status(200).json(allUsers);
    } catch (error) {
        console.error('Error fetching attendees for event:', error);
        res.status(500).json({ message: 'Failed to fetch attendees.' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Get all past events (hosted or attended) for a user
router.get('/users/:id/past-events', authorize(), async (req: AuthenticatedRequest, res: Response) => {
    let userId: string;
    try {
        userId = req.params.id;
        // Basic UUID validation
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
            res.status(400).json({ error: 'Invalid user ID format' });
            return;
        }
    } catch {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
    }
    
    try {
        // Get current date
        const now = new Date();
        // Find events where user is host and date is in the past
        const hostedEvents = await prisma.event.findMany({
            where: {
                hostId: userId,
                date: { lt: now },
                isDeleted: false
            },
            include: { attendees: true }
        });
        // Find events where user is an attendee and date is in the past
        const attendedEvents = await prisma.attendee.findMany({
            where: {
                userId,
                event: { date: { lt: now }, isDeleted: false }
            },
            include: { event: { include: { attendees: true } } }
        });
        // Format attended events to match hostedEvents structure
        const attendedEventsFormatted = attendedEvents.map(a => ({ ...a.event, role: 'ATTENDEE' }));
        const hostedEventsFormatted = hostedEvents.map(e => ({ ...e, role: 'HOST' }));
        // Merge and sort by date descending
        const allPastEvents = [...hostedEventsFormatted, ...attendedEventsFormatted].sort((a, b) => b.date.getTime() - a.date.getTime());
        res.status(200).json(allPastEvents);
    } catch (error) {
        console.error('Error fetching past events for user:', error);
        res.status(500).json({ message: 'Failed to fetch past events.' });
    }
});

export default router;