import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to get user initials
const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

interface UserAvatarProps {
    user?: {
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        image?: string | null;
        profilePicture?: string | null;
    } | null;
    size?: "sm" | "md" | "lg";
    fallback?: string;
}

export function UserAvatar({ user, size = "md", fallback = "?" }: UserAvatarProps) {
    // Get image from either profilePicture or image property (different APIs might use different names)
    const imageUrl = user?.profilePicture || user?.image;

    // Get name for alt text
    const name = user?.name ||
        (user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.email || "User");

    // Get initials for fallback
    const initials = user?.firstName || user?.lastName
        ? getInitials(user.firstName, user.lastName)
        : fallback;

    // Set size classes
    const sizeClasses = {
        sm: "h-6 w-6 text-xs",
        md: "h-8 w-8 text-sm",
        lg: "h-10 w-10 text-base"
    };

    return (
        <Avatar className={sizeClasses[size]}>
            {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name} />
            ) : null}
            <AvatarFallback className="bg-brand text-brand-foreground">
                {initials}
            </AvatarFallback>
        </Avatar>
    );
} 