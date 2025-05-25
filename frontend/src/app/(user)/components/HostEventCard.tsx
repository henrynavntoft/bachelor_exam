import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from "date-fns";
import { Event } from "@/types/event";

interface HostEventCardProps {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete: (eventId: string) => void;
}

export function HostEventCard({ event, onEdit, onDelete }: HostEventCardProps) {
    return (
        <Card>
            <CardContent className="flex justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <p className="text-sm">{format(new Date(event.date), 'MM/dd/yyyy')}</p>
                    <p className="text-sm">{event.location}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {event.images.map((img: string) => (
                            <Image key={img} src={img} alt={event.title} width={80} height={80} className="rounded" />
                        ))}
                    </div>
                </div>
                <CardFooter className="flex items-start">
                    <Button
                        variant="outline"
                        onClick={() => onEdit(event)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => onDelete(event.id)}
                        className="ml-2"
                    >
                        Delete
                    </Button>
                </CardFooter>
            </CardContent>
        </Card>
    );
} 