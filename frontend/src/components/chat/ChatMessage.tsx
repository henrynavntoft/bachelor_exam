import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UserAvatar } from "@/components/users/UserAvatar";

interface ChatMessageProps {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name?: string;
        email?: string;
        image?: string | null;
    };
    isCurrentUser: boolean;
}

export function ChatMessage({
    content,
    createdAt,
    user,
    isCurrentUser
}: ChatMessageProps) {
    const userName = user.name || user.email || "Unknown";
    const displayName = isCurrentUser ? "You" : userName;

    return (
        <div className={cn(
            "flex w-full",
            isCurrentUser ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "max-w-[80%] rounded-lg px-4 py-3 flex flex-col gap-1",
                isCurrentUser
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted"
            )}>
                <div className="flex items-center gap-2">
                    <UserAvatar user={user} size="sm" fallback={userName?.[0]?.toUpperCase() || "?"} />
                    <span className="text-xs font-semibold">{displayName}</span>
                </div>

                <p className="text-sm break-words">{content}</p>

                <p className="text-xs opacity-75 mt-1 text-right">
                    {format(new Date(createdAt), 'MMM d, HH:mm')}
                </p>
            </div>
        </div>
    );
} 