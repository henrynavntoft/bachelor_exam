import { User } from './user';
import { Event } from './event';

export interface Message {
    id: string;
    content: string;
    createdAt?: string; // Dates as strings for frontend
    userId: string;
    eventId: string;

    // Optional: Include full User/Event objects if your API returns them nested
    user?: User;
    event?: Pick<Event, 'id' | 'title'>; // Example: might only need event id/title
} 