'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProfilePage() {
    const { isAuthenticated, isHost, isGuest, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router, isLoading]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isHost && !isGuest) {
        return <div>Access Denied</div>;
    }

    if (isHost) {
        return <div>Host Profile</div>;
    }

    if (isGuest) {
        return <div>Guest Profile</div>;
    }
}