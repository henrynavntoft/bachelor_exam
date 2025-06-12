'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { UserAvatar } from '@/app/(user)/components/UserAvatar';

// Reusable ThemeSelector component
function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    
    const themeOptions = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ];

    return (
        <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
            {themeOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                    key={value}
                    onClick={() => setTheme(value)}
                    className="cursor-pointer flex items-center gap-2"
                >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {theme === value && <span className="ml-auto text-brand">✓</span>}
                </DropdownMenuItem>
            ))}
        </>
    );
}

// Helper function for profile links
function getProfileLink(role: string): { href: string; label: string } {
    switch (role) {
        case 'ADMIN':
            return { href: '/admin-profile', label: 'Admin Dashboard' };
        case 'HOST':
            return { href: '/host-profile', label: 'Host Profile' };
        default:
            return { href: '/guest-profile', label: 'Guest Profile' };
    }
}

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex-shrink-0">
                        <Image src="/logo.svg" alt="Logo" width={50} height={50} className="hover:opacity-90 transition-opacity" />
                    </Link>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="px-3 py-2 flex items-center gap-3 cursor-pointer rounded-md hover:bg-accent">
                                    <Menu strokeWidth={1} size={20} />
                                    <UserAvatar user={user} fallback="?" size="md" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {user ? (
                                    <>
                                        <DropdownMenuLabel>
                                            <div className="font-normal">
                                                <p className="font-medium">Hi, {user.firstName}!</p>
                                                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={getProfileLink(user.role).href} className="cursor-pointer">
                                                {getProfileLink(user.role).label}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <ThemeSelector />
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                                            Logout
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <>
                                        <DropdownMenuItem asChild>
                                            <Link href="/login" className="cursor-pointer">Login</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/signup" className="cursor-pointer">Sign up</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <ThemeSelector />
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}