import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_ACCESS_TOKEN";

interface MapboxLocationInputProps {
    value: string;
    onChange: (val: string) => void;
}

interface MapboxSuggestion {
    id: string;
    place_name: string;
}

export function MapboxLocationInput({ value, onChange }: MapboxLocationInputProps) {
    const [query, setQuery] = useState(value || "");
    const [showDropdown, setShowDropdown] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const { theme } = useTheme();

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(handler);
    }, [query]);

    const { data: suggestions = [] } = useQuery<MapboxSuggestion[]>({
        queryKey: ["mapbox-suggestions", debouncedQuery],
        enabled: !!debouncedQuery,
        queryFn: async () => {
            const res = await axios.get(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedQuery)}.json`,
                {
                    params: {
                        access_token: MAPBOX_TOKEN,
                        autocomplete: true,
                        limit: 5,
                    },
                }
            );
            return (res.data.features || []).map((f: { id: string; place_name: string }) => ({
                id: f.id,
                place_name: f.place_name,
            }));
        },
    });

    return (
        <div className="relative">
            <Input
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setShowDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
                placeholder="Search for a location"
                autoComplete="off"
            />
            {showDropdown && suggestions.length > 0 && (
                <ul className={cn(
                    "absolute z-10 w-full mt-1 rounded shadow max-h-60 overflow-auto",
                    "border border-border",
                    theme === "dark"
                        ? "bg-card text-card-foreground"
                        : "bg-white"
                )}>
                    {suggestions.map(s => (
                        <li
                            key={s.id}
                            className={cn(
                                "px-4 py-2 cursor-pointer",
                                theme === "dark"
                                    ? "hover:bg-accent hover:text-accent-foreground"
                                    : "hover:bg-gray-100"
                            )}
                            onMouseDown={() => {
                                setQuery(s.place_name);
                                onChange(s.place_name);
                                setShowDropdown(false);
                            }}
                        >
                            {s.place_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
} 