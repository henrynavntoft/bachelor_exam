import { User } from './user';
import { Attendee } from './attendee'; // Will be created next
import { Message } from './message'; // Will be created next

export interface Event {
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string; // Dates as strings for frontend
    location: string;
    hostId: string;
    isDeleted?: boolean; // Added from Prisma
    createdAt?: string; // Added from Prisma
    updatedAt?: string; // Added from Prisma

    // Relations (shapes depend on how much detail you fetch)
    host?: User; // Typically, you'd fetch host details
    attendees?: Attendee[]; // List of attendee records
    messages?: Message[]; // List of messages for the event chat
} 