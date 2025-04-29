'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="flex justify-between p-4">
            <Link href="/">Meet & Greet</Link>
            {user ? (
                <button onClick={logout}>Logout</button>
            ) : (
                <>
                    <Link href="/login" className="mr-4">Login</Link>
                </>
            )}
        </header>
    );
}