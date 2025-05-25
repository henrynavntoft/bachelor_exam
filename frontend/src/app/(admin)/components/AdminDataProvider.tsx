'use client';

import { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { User } from '@/types/user';
import { Event } from '@/types/event';
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

    // Fetch all users
    const {
        data: users = [],
        isLoading: usersLoading,
        error: usersError
    } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get(routes.users.all, { withCredentials: true });
                // Handle both cases - direct array or nested inside an object
                const usersData = res.data.users || res.data;

                // Ensure we always return an array
                if (Array.isArray(usersData)) {
                    return usersData;
                } else {
                    console.error('Users data is not an array:', usersData);
                    return [];
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                return [];
            }
        },
        enabled: isAuthenticated && isAdmin,
    });

    // Fetch all events
    const {
        data: events = [],
        isLoading: eventsLoading,
        error: eventsError
    } = useQuery<Event[]>({
        queryKey: ['events'],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
                // Make sure we're handling the response correctly - check if events is nested
                const eventsData = res.data.events || res.data;

                // Ensure we always return an array
                if (Array.isArray(eventsData)) {
                    return eventsData;
                } else {
                    console.error('Events data is not an array:', eventsData);
                    return [];
                }
            } catch (error) {
                console.error('Error fetching events:', error);
                return [];
            }
        },
        enabled: isAuthenticated && isAdmin,
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(routes.users.delete(id), { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(routes.events.delete(id), { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });

    // Reactivate user mutation
    const reactivateUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const user = users.find(u => u.id === userId);
            if (!user) throw new Error('User not found');

            return axiosInstance.put(
                routes.users.update(userId),
                {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isDeleted: false
                },
                { withCredentials: true }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    // Aggregate loading state
    const isLoading = authLoading || usersLoading || eventsLoading;

    // Aggregate error state
    const error = usersError || eventsError || null;

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div className="text-center mt-8 text-destructive">Failed to load data.</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

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