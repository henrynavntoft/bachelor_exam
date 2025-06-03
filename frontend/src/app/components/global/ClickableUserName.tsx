'use client';

import { useRouter } from 'next/navigation';

interface ClickableUserNameProps {
    userId: string;
    firstName: string;
    lastName: string;
    className?: string;
    showHover?: boolean;
}

export function ClickableUserName({ 
    userId, 
    firstName, 
    lastName, 
    className = "", 
    showHover = true 
}: ClickableUserNameProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(`/profile/${userId}`)}
            className={`
                text-left p-0 bg-transparent border-none cursor-pointer
                ${showHover ? 'hover:text-brand hover:underline transition-colors' : ''}
                ${className}
            `}
        >
            {firstName} {lastName}
        </button>
    );
} 