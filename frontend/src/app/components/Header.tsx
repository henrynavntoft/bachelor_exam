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
import { CircleUserRound, Menu } from 'lucide-react';





export default function Header() {
    const { user, logout } = useAuth();


    return (
        // REMOVED: fixed top-0 left-0 right-0 z-50
        // ADDED: w-full px-6 py-4 bg-background flex justify-between items-center
        // (Re-arranged existing classes and removed the fixed ones)
        <header className="w-full px-6 py-4 bg-background flex justify-between items-center">
            <Link href="/" className="flex-shrink-0">
                <Image src="/logo.png" alt="Logo" width={75} height={75} className="hover:opacity-90 transition-opacity" />
            </Link>

            <div className="flex items-center gap-4">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>


                            <button className="px-3 py-2 flex items-center gap-3 rounded-full overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"> {/* Added focus states */}
                                <Menu strokeWidth={1} size={20} />
                                {user.profilePicture ? (
                                    <Image
                                        src={user.profilePicture}
                                        alt="Profile Picture"
                                        width={30}
                                        height={30}
                                        className="rounded-full aspect-square object-cover" // Added object-cover
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
                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"> {/* Added focus styles */}
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>

                            <button className="px-3 py-2 flex items-center gap-3 rounded-full overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"> {/* Added focus states */}
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}