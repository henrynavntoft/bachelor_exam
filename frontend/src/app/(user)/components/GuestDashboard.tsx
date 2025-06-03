'use client';

import { EventCard } from '@/app/(event)/components/EventCard';
import { PastEventCard } from './PastEventRatingCard';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarCheck, Search } from 'lucide-react';

interface GuestDashboardProps {
    currentUser: User | null;
    upcomingEvents: Event[];
    pastEvents: Event[];
    isLoadingEvents: boolean;
}

export function GuestDashboard({
    currentUser,
    upcomingEvents,
    pastEvents,
    isLoadingEvents,
}: GuestDashboardProps) {
    if (isLoadingEvents) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-8">            
            {/* Upcoming Events Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 pt-4">
                        <Calendar className="h-5 w-5 text-brand" />
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {upcomingEvents && upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={currentUser as User}
                                    showAttendControls={true}
                                    isPastEvent={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">You don&apos;t have any upcoming events.</p>
                            <Button asChild className="bg-brand hover:bg-brand/90">
                                <Link href={'/'}>Browse Events</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Past Events Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 pt-4">
                        <CalendarCheck className="h-5 w-5 text-brand" />
                        Past Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {pastEvents && pastEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastEvents.map((event) => (
                                <PastEventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={currentUser!}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No past events to display.</p>
                            <p className="text-sm text-muted-foreground mt-1">Past events will appear here after you attend them.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 