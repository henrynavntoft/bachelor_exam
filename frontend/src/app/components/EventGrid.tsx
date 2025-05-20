import Card from "./Card";
import { Event } from "@/hooks/useEvents";

interface EventGridProps {
    events: Event[];
}

export default function EventGrid({ events }: EventGridProps) {
    // Using a fixed class instead of dynamic generation since Tailwind needs to see the complete class at build time
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            {events.map((event) => (
                <Card key={event.id} event={event} showAttendButton={false} />
            ))}
        </div>
    );
} 