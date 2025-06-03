'use client';

import { Button } from "@/components/ui/button";
import { EventForm } from '@/app/(user)/components/EventForm';
import { EventCard } from '@/app/(event)/components/EventCard';
import { PastEventCard } from './PastEventRatingCard';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { EventFormData } from '@/lib/schemas/event.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarCheck, Plus, Settings } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface HostDashboardProps {
    currentUser: User | null;
    upcomingEvents: Event[];
    pastEvents: Event[];
    isCreating: boolean;
    selectedEventId: string | null;
    setIsCreating: (isCreating: boolean) => void;
    setSelectedEventId: (id: string | null) => void;
    handleCreateSubmit: (data: EventFormData) => Promise<void>;
    handleEditSubmit: (data: EventFormData) => Promise<void>;
    handleDelete: (eventId: string) => void;
}

export function HostDashboard({
    currentUser,
    upcomingEvents,
    pastEvents,
    isCreating,
    selectedEventId,
    setIsCreating,
    setSelectedEventId,
    handleCreateSubmit,
    handleEditSubmit,
    handleDelete,
}: HostDashboardProps) {
    const allEvents = [...upcomingEvents, ...pastEvents];
    const selectedEventData = allEvents.find(e => e.id === selectedEventId);

    // Prepare initialData for the form with corrected eventType
    const formInitialData = selectedEventData ? {
        ...selectedEventData,
        eventType: selectedEventData.eventType as "BREAKFAST" | "LUNCH" | "DINNER" | "SPECIAL" | undefined,
        date: selectedEventData.date ? new Date(selectedEventData.date).toISOString().slice(0, 16) : undefined,
    } : undefined;

    return (
        <div className="space-y-8">
            {/* Event Management Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 pt-4">
                        <Settings className="h-5 w-5 text-brand" />
                        Event Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Create and manage your events from here
                            </p>
                        </div>
                        {isCreating ? (
                            <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => setIsCreating(true)} className="bg-brand hover:bg-brand/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        )}
                    </div>

                    {isCreating && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <EventForm onSubmit={handleCreateSubmit} onCancel={() => setIsCreating(false)} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 pt-4">
                        <Calendar className="h-5 w-5 text-brand" />
                        Upcoming Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">You don&apos;t have any upcoming events.</p>
                            <p className="text-sm text-muted-foreground mt-1">Create your first event to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={currentUser}
                                    onEdit={() => setSelectedEventId(event.id)}
                                    onDelete={() => handleDelete(event.id)}
                                    isPastEvent={false}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Past Events */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 pt-4">
                        <CalendarCheck className="h-5 w-5 text-brand" />
                        Past Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {pastEvents.length === 0 ? (
                        <div className="text-center py-8">
                            <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No past events to display.</p>
                            <p className="text-sm text-muted-foreground mt-1">Past events will appear here after they occur.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastEvents.map((event) => (
                                <PastEventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={currentUser!}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit event modal */}
            {selectedEventId && selectedEventData && (
                <AlertDialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
                    <AlertDialogContent className="sm:max-w-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Edit Event</AlertDialogTitle>
                            <AlertDialogDescription>
                                Make changes to your event here.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="max-h-[75vh] overflow-y-auto p-1">
                            <EventForm
                                initialData={formInitialData}
                                onSubmit={handleEditSubmit}
                                onCancel={() => setSelectedEventId(null)}
                                existingImages={selectedEventData.images || []}
                                isEditing
                            />
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
} 