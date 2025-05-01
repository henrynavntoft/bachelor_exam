import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Event {
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    location: string;
}
export default function EventCard({ event }: { event: Event }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <p>{event.description}</p>
                <p>{event.location}</p>
                <p>{format(new Date(event.date), 'MM/dd/yyyy')}</p>
                <div className="flex flex-row gap-4">
                    {event.images.map((image) => (
                        <Image key={image} src={image} alt={event.title} width={100} height={200} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}