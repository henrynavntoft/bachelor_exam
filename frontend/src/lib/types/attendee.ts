import { User } from './user';
import { Event } from './event';

export interface Attendee {
    id: string;
    userId: string;
    eventId: string;
    createdAt?: string; // Dates as strings for frontend

    // Optional: Include full User/Event objects if your API returns them nested
    user?: User;
    event?: Event;
} 