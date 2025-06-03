import { User } from './user';
import { Event } from './event';

export interface Rating {
    id: string;
    rating: number;
    comment?: string;
    ratedUserId: string;
    raterUserId: string;
    eventId: string;
    createdAt?: string;
    
    // Relations
    raterUser?: User;
    ratedUser?: User;
    event?: Event;
}

export interface AverageRating {
    averageRating: number | null;
    ratingCount: number;
} 