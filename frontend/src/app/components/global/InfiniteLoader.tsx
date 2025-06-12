import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteLoaderProps {
    isFetchingNextPage: boolean;
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    itemCount: number;
}

// Loading state component
const LoadingState = () => (
    <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-brand" />
        <span className="text-sm text-muted-foreground">Loading more events...</span>
    </div>
);

// Different message states
const MessageState = ({ hasNextPage, itemCount }: { hasNextPage?: boolean; itemCount: number }) => {
    if (hasNextPage) {
        return <span className="text-sm text-muted-foreground">Scroll for more events</span>;
    }
    
    if (itemCount > 0) {
        return <span className="text-sm text-muted-foreground">No more events to load</span>;
    }
    
    return null;
};

export default function InfiniteLoader({
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    itemCount
}: InfiniteLoaderProps) {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Consolidated intersection observer logic
    useEffect(() => {
        const currentElement = loadMoreRef.current;
        if (!currentElement) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(currentElement);

        return () => observer.unobserve(currentElement);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
            {isFetchingNextPage ? (
                <LoadingState />
            ) : (
                <MessageState hasNextPage={hasNextPage} itemCount={itemCount} />
            )}
        </div>
    );
} 