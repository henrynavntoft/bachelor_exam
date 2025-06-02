'use client';

import { Button } from "@/components/ui/button";
import { EventForm } from '@/app/(user)/components/EventForm';
import { EventCard } from '@/app/(event)/components/EventCard';
import { Event } from '@/lib/types/event';
import { User } from '@/lib/types/user';
import { EventFormData } from '@/lib/schemas/event.schemas';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface HostDashboardProps {
    currentUser: User | null;
    events: Event[];
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
    events,
    isCreating,
    selectedEventId,
    setIsCreating,
    setSelectedEventId,
    handleCreateSubmit,
    handleEditSubmit,
    handleDelete,
}: HostDashboardProps) {
    const selectedEventData = events.find(e => e.id === selectedEventId);

    // Prepare initialData for the form with corrected eventType
    const formInitialData = selectedEventData ? {
        ...selectedEventData,
        eventType: selectedEventData.eventType as "BREAKFAST" | "LUNCH" | "DINNER" | "SPECIAL" | undefined,
        date: selectedEventData.date ? new Date(selectedEventData.date).toISOString().slice(0, 16) : undefined,
    } : undefined;

    return (
        <article className="">
            <h1 className="text-2xl font-bold mb-4 text-center">Host Dashboard</h1>

            {/* CREATE EVENT */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Your Events</h3>
                {isCreating ? (
                    <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                    </Button>
                ) : (
                    <Button size="sm" onClick={() => setIsCreating(true)}>
                        Create Event
                    </Button>
                )}
            </div>

            {isCreating && (
                <div className="my-4">
                    <EventForm onSubmit={handleCreateSubmit} onCancel={() => setIsCreating(false)} />
                </div>
            )}

            {/* Event list */}
            <div className="space-y-4 mt-6">
                {events.length === 0 ? (
                    <p className="text-center text-muted-foreground">You haven&apos;t created any events yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                currentUser={currentUser}
                                onEdit={() => setSelectedEventId(event.id)}
                                onDelete={() => handleDelete(event.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

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
        </article>
    );
} 