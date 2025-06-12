import { Button } from "@/components/ui/button";
import Map from "./Map";
import { Event } from "@/lib/types/event";

interface MobileMapProps {
    isVisible: boolean;
    onClose: () => void;
    events: Event[];
}

export default function MobileMap({ isVisible, onClose, events }: MobileMapProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute top-4 right-4 z-10">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                >
                    Close Map
                </Button>
            </div>
            <Map events={events} />
        </div>
    );
} 