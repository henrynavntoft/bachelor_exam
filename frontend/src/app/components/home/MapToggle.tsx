import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface MapToggleProps {
    onShowMap: () => void;
}

export default function MapToggle({ onShowMap }: MapToggleProps) {
    return (
        <Button
            variant="outline"
            className="lg:hidden flex items-center gap-2"
            onClick={onShowMap}
        >
            <MapPin className="w-4 h-4" />
            View Map
        </Button>
    );
} 