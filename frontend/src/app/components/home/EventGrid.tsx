import { EventCard } from '@/app/(event)/components/EventCard';
import { Event } from "@/hooks/useEvents";
import { User } from '@/lib/types/user';

interface EventGridProps {
    events: Event[];
    currentUser: User | null;
}

export default function EventGrid({ events, currentUser }: EventGridProps) {
    // Using a fixed class instead of dynamic generation since Tailwind needs to see the complete class at build time
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    showAttendControls={true}
                    isClickable={true}
                />
            ))}
        </div>
    );
} 