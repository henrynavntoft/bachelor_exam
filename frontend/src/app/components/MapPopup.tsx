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
        <Link href={`/events/${id}`} className="block no-underline text-inherit">
            <div className="p-4 min-w-[250px] font-sans">
                <h3 className="m-0 mb-2 text-lg font-semibold text-[#1A6258]">{title}</h3>
                <div className="space-y-2">
                    <p className="m-0 text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-[#1A6258]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {location}
                    </p>
                    <p className="m-0 text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-[#1A6258]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {format(new Date(date), 'MMM d, yyyy')}
                    </p>
                </div>
            </div>
        </Link>
    );
} 