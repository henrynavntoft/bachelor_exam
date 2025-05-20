'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDataProvider } from '@/components/admin/AdminDataProvider';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function DashboardPage() {
    const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
    const router = useRouter();

    // Auth protection
    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/login');
        }
    }, [isAuthenticated, isAdmin, isLoading, router]);

    // If still loading, show nothing to prevent flicker
    if (isLoading) {
        return null;
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <AdminDataProvider>
            {({ users, events, deleteUser, deleteEvent, reactivateUser }) => (
                <AdminDashboard
                    currentUser={user ? {
                        ...user,
                        isDeleted: false
                    } : null}
                    users={users}
                    events={events}
                    onDeleteUser={deleteUser}
                    onDeleteEvent={deleteEvent}
                    onReactivateUser={reactivateUser}
                />
            )}
        </AdminDataProvider>
    );
}