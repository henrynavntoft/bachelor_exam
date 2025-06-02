'use client';

import { EventCard } from '@/app/(event)/components/EventCard';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface GuestDashboardProps {
    currentUser: User | null;
    rsvpedEvents: Event[];
    isLoadingEvents: boolean;
}

export function GuestDashboard({
    currentUser,
    rsvpedEvents,
    isLoadingEvents,
}: GuestDashboardProps) {
    if (isLoadingEvents) {
        return <LoadingSpinner />;
    }

    return (
        <article className="">
            <h1 className="text-2xl font-bold mb-4 text-center">Guest Dashboard</h1>
            <div className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Your RSVPs</h2>
                {rsvpedEvents && rsvpedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rsvpedEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                currentUser={currentUser as User}
                                showAttendControls={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-center text-muted-foreground">You haven&apos;t RSVPed to any events yet.</p>
                        <Button asChild>
                            <Link href={'/'}>Browse events</Link>
                        </Button>
                    </div>
                )}
            </div>
        </article>
    );
} 