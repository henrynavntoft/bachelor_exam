'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
export default function Header() {
    const { user, logout } = useAuth();


    return (
        <header className="flex justify-between p-4 items-center">
            <Link href="/">
                <Image src="/logo.png" alt="Logo" width={75} height={75} />
            </Link>
            <div className="flex items-center space-x-4">
                {user ? (
                    <>
                        <Button onClick={logout}>Logout</Button>
                        <Button asChild>
                            <Link href={user.role === 'ADMIN' ? '/dashboard' : '/profile'}>
                                {user.role === 'ADMIN' ? 'Dashboard' : 'Profile'}
                            </Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Signup</Link>
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}