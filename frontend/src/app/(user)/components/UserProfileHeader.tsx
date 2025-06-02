'use client';

import { User } from '@/lib/types/user';
import { UserAvatar } from './UserAvatar';

interface UserProfileHeaderProps {
    user: Pick<User, 'firstName' | 'lastName' | 'email' | 'role' | 'profilePicture'>;
    avatarSize?: 'sm' | 'md' | 'lg';
    subtitleField?: 'email' | 'role';
    className?: string;
}

export function UserProfileHeader({
    user,
    avatarSize = 'lg',
    subtitleField = 'role',
    className = ''
}: UserProfileHeaderProps) {
    const subtitle = subtitleField === 'role' ? user.role?.toLowerCase() : user.email;

    return (
        <div className={`flex flex-col md:flex-row gap-4 items-center md:items-start ${className}`}>
            <div className="flex-shrink-0">
                <UserAvatar user={user} size={avatarSize} />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground capitalize">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
} 