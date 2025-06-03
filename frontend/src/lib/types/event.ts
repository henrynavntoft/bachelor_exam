import { User } from './user';
import { Attendee } from './attendee'; // Will be created next
import { Message } from './message'; // Will be created next

export interface EventImage {
    id: string;
    imageUrl: string;
    altText?: string | null;
    order: number;
    createdAt?: string;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    images: EventImage[]; // Updated to use EventImage objects instead of string[]
    date: string; // Dates as strings for frontend
    location: string;
    hostId: string;
    isDeleted?: boolean; // Added from Prisma
    createdAt?: string; // Added from Prisma
    updatedAt?: string; // Added from Prisma

    // New fields from schema
    pricePerPerson?: number | null;
    eventType?: string; // Or 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SPECIAL';
    capacity?: number | null; // Added capacity

    // Relations (shapes depend on how much detail you fetch)
    host?: User; // Typically, you'd fetch host details
    attendees?: Attendee[]; // List of attendee records
    messages?: Message[]; // List of messages for the event chat
} 