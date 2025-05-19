'use client';
import { format } from 'date-fns';
import Link from 'next/link';


interface MapPopupProps {
    id: string;
    title: string;
    location: string;
    date: string;
}

export default function MapPopup({ id, title, location, date }: MapPopupProps) {
    return (
        <div className="popup-container bg-background text-foreground overflow-hidden border-none border-radius-none outline-none">
            <Link href={`/events/${id}`} className="block p-4 hover:bg-accent">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <div className="text-sm text-muted-foreground mt-1">
                    <p>{location}</p>
                    <p>{format(new Date(date), 'MMM dd, yyyy')}</p>
                </div>
            </Link>
        </div>
    );
} 