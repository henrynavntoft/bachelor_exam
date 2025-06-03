import { Router, Response } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { prisma } from '../config/prisma';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { createEventImageSchema, updateEventImageSchema } from '../schemas/eventSchema';
import { z } from 'zod';

const router = Router();

// Schema for route params
const eventImageParamSchema = z.object({
    eventId: z.string().uuid({ message: 'Invalid event ID' }),
    imageId: z.string().uuid({ message: 'Invalid image ID' }).optional(),
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Get all images for an event
router.get('/:eventId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = eventImageParamSchema.parse(req.params);
        const { eventId } = params;

        const images = await prisma.eventImage.findMany({
            where: { eventId },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                imageUrl: true,
                altText: true,
                order: true,
                createdAt: true,
            }
        });

        res.status(200).json(images);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        console.error('Error fetching event images:', error);
        res.status(500).json({ message: 'Failed to fetch event images' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Add image to event
router.post('/:eventId', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const params = eventImageParamSchema.parse(req.params);
        const { eventId } = params;

        const body = createEventImageSchema.parse(req.body);
        const { imageUrl, altText, order } = body;

        // Check if event exists and user has permission (EVENT_OWNER middleware handles this)
        const event = await prisma.event.findUnique({
            where: { id: eventId, isDeleted: false }
        });

        if (!event) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        // Create the image
        const eventImage = await prisma.eventImage.create({
            data: {
                eventId,
                imageUrl,
                altText,
                order
            }
        });

        res.status(201).json(eventImage);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        console.error('Error adding event image:', error);
        res.status(500).json({ message: 'Failed to add event image' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// PUT: Update event image
router.put('/:eventId/:imageId', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventImageParams = z.object({
            eventId: z.string().uuid(),
            imageId: z.string().uuid()
        }).parse(req.params);
        
        const { eventId, imageId } = eventImageParams;
        const body = updateEventImageSchema.parse(req.body);

        // Check if image exists and belongs to the event
        const existingImage = await prisma.eventImage.findFirst({
            where: { 
                id: imageId, 
                eventId: eventId 
            }
        });

        if (!existingImage) {
            res.status(404).json({ message: 'Image not found' });
            return;
        }

        // Update the image
        const updatedImage = await prisma.eventImage.update({
            where: { id: imageId },
            data: body
        });

        res.status(200).json(updatedImage);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        console.error('Error updating event image:', error);
        res.status(500).json({ message: 'Failed to update event image' });
    }
});

//////////////////////////////////////////////////////////////////////////////////
// DELETE: Remove image from event
router.delete('/:eventId/:imageId', authorize(['EVENT_OWNER']), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventImageParams = z.object({
            eventId: z.string().uuid(),
            imageId: z.string().uuid()
        }).parse(req.params);
        
        const { eventId, imageId } = eventImageParams;

        // Check if image exists and belongs to the event
        const existingImage = await prisma.eventImage.findFirst({
            where: { 
                id: imageId, 
                eventId: eventId 
            }
        });

        if (!existingImage) {
            res.status(404).json({ message: 'Image not found' });
            return;
        }

        // Delete the image
        await prisma.eventImage.delete({
            where: { id: imageId }
        });

        res.status(204).send();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((issue: ZodIssue) => issue.message).join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        console.error('Error deleting event image:', error);
        res.status(500).json({ message: 'Failed to delete event image' });
    }
});

export default router; 