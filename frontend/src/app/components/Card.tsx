import Image from "next/image";

interface Event {
    id: string;
    title: string;
    description: string;
    images: string[];
    date: string;
    location: string;
}
export default function Card({ event }: { event: Event }) {
    return <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 flex flex-row justify-between">
        <div>
            <h1>{event.title}</h1>
            <p>{event.description}</p>
            <p>{event.location}</p>
        </div>
        <div>
            <Image src={`https://picsum.photos/200/300?random`} alt={event.title} width={200} height={300} />
        </div>
    </div>;
}