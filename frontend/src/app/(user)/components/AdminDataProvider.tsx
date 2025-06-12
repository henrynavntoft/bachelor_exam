'use client';

import { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { User } from '@/lib/types/user';
import { Event } from '@/lib/types/event';
import LoadingSpinner from '@/app/components/global/LoadingSpinner';

interface AdminDataProviderProps {
    children: (data: {
        users: User[];
        events: Event[];
        deleteUser: (id: string) => void;
        deleteEvent: (id: string) => void;
        reactivateUser: (id: string) => void;
        isLoading: boolean;
        error: Error | null;
    }) => ReactNode;
}

export function AdminDataProvider({ children }: AdminDataProviderProps) {
    const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();

    // Fetch users
    const {
        data: users = [],
        isLoading: usersLoading,
        error: usersError
    } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.all, { withCredentials: true });
            return res.data.users || res.data;
        },
        enabled: isAuthenticated && isAdmin,
        staleTime: 5 * 60 * 1000, // 5 minutes - users don't change frequently
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
        refetchOnWindowFocus: false,
    });

    // Fetch events
    const {
        data: events = [],
        isLoading: eventsLoading,
        error: eventsError
    } = useQuery<Event[]>({
        queryKey: ['admin-events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data.events || res.data;
        },
        enabled: isAuthenticated && isAdmin,
        staleTime: 2 * 60 * 1000, // 2 minutes - events change more frequently
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
        refetchOnWindowFocus: false,
    });

    // Delete user
    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(routes.users.delete(id), { withCredentials: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // Delete event
    const deleteEventMutation = useMutation({
        mutationFn: (id: string) => axiosInstance.delete(routes.events.delete(id), { withCredentials: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        }
    });

    // Reactivate user
    const reactivateUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const user = users.find(u => u.id === userId);
            if (!user) throw new Error('User not found');

            return axiosInstance.put(
                routes.users.update(userId),
                { ...user, isDeleted: false },
                { withCredentials: true }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const isLoading = authLoading || usersLoading || eventsLoading;
    const error = usersError || eventsError || null;

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-center mt-8 text-destructive">Failed to load data.</div>;
    if (!isAuthenticated || !isAdmin) return null;

    return (
        <>
            {children({
                users,
                events,
                deleteUser: (id: string) => deleteUserMutation.mutate(id),
                deleteEvent: (id: string) => deleteEventMutation.mutate(id),
                reactivateUser: (id: string) => reactivateUserMutation.mutate(id),
                isLoading,
                error
            })}
        </>
    );
} 