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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to get user initials
const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <Link href="/" className="flex-shrink-0">
                        <Image src="/logo.svg" alt="Logo" width={50} height={50} className="hover:opacity-90 transition-opacity" />
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-2 flex items-center gap-3 cursor-pointer rounded-md hover:bg-accent">
                                        <Menu strokeWidth={1} size={20} />
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profilePicture || ""} alt={`${user.firstName} ${user.lastName}`} />
                                            <AvatarFallback className="bg-brand text-brand-foreground">
                                                {getInitials(user.firstName, user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="font-normal">
                                            <p className="font-medium">Hi, {user.firstName}!</p>
                                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={user.role === 'ADMIN' ? '/admin' : '/profile'} className="cursor-pointer">
                                            {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Profile'}
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        <span>Light</span>
                                        {theme === "light" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        <span>Dark</span>
                                        {theme === "dark" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        <span>System</span>
                                        {theme === "system" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-2 flex items-center gap-3 cursor-pointer rounded-md hover:bg-accent">
                                        <Menu strokeWidth={1} size={20} />
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-brand text-brand-foreground">
                                                ?
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href="/login" className="cursor-pointer">
                                            Login
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/signup" className="cursor-pointer">
                                            Sign up
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        <span>Light</span>
                                        {theme === "light" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        <span>Dark</span>
                                        {theme === "dark" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        <span>System</span>
                                        {theme === "system" && <span className="ml-auto text-brand">✓</span>}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}