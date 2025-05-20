export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    hostId: string;
    images?: string[];
    attendees?: {
        userId: string;
        eventId: string;
    }[];
    host?: {
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
} 