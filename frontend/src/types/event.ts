export interface Event {
    hostId: string;
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    images: string[];
    attendees?: Array<{
        userId: string;
        eventId: string;
    }>;
} 