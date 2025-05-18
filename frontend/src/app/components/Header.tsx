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
} from "@/components/ui/dropdown-menu"
import { CircleUserRound, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    return (
        <header className="w-full px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex-shrink-0">
                <Image src="/logo.svg" alt="Logo" width={75} height={75} className="hover:opacity-90 transition-opacity" />
            </Link>

            <div className="flex items-center gap-4">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="px-3 py-2 flex items-center gap-3 rounded-full overflow-hidden cursor-pointer border hover:border-input transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                                <Menu strokeWidth={1} size={20} />
                                {user.profilePicture ? (
                                    <Image
                                        src={user.profilePicture}
                                        alt="Profile Picture"
                                        width={30}
                                        height={30}
                                        className="rounded-full aspect-square object-cover"
                                    />
                                ) : (
                                    <CircleUserRound strokeWidth={1} size={30} />
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Hey, {user.firstName}!</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={user.role === 'ADMIN' ? '/dashboard' : '/profile'} className="cursor-pointer">
                                    {user.role === 'ADMIN' ? 'Dashboard' : 'Profile'}
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

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="px-3 py-2 flex items-center gap-3 overflow-hidden cursor-pointer border hover:border-input transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent">
                                <Menu strokeWidth={1} size={20} />
                                <CircleUserRound strokeWidth={1} size={30} />
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}