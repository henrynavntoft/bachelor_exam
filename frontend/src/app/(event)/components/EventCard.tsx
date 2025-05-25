'use client';

import { Event } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EventCardProps {
    event: Event;
    onDelete: (id: string) => void;
    isAdmin?: boolean;
}

export function EventCard({ event, onDelete, isAdmin = false }: EventCardProps) {
    return (
        <Card>
            <CardContent className="flex flex-row justify-between items-center gap-2 py-4">
                <div className="flex flex-col gap-2">
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-muted-foreground">{event.location}</div>
                    <div className="text-sm text-muted-foreground">
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                    </div>
                </div>

                {isAdmin && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete {event.title}? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => onDelete(event.id)}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </CardContent>
        </Card>
    );
} 