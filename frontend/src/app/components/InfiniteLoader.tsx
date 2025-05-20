import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteLoaderProps {
    isFetchingNextPage: boolean;
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    itemCount: number;
}

export default function InfiniteLoader({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    itemCount
}: InfiniteLoaderProps) {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Implement intersection observer for infinite scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const currentElement = loadMoreRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div
            ref={loadMoreRef}
            className="w-full py-8 flex justify-center"
        >
            {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                    <span className="text-sm text-muted-foreground">Loading more events...</span>
                </div>
            ) : hasNextPage ? (
                <span className="text-sm text-muted-foreground">Scroll for more events</span>
            ) : itemCount > 0 ? (
                <span className="text-sm text-muted-foreground">No more events to load</span>
            ) : null}
        </div>
    );
} 