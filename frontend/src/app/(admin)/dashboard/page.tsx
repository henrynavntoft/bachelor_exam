'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card";
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    name: string;
    role: string;
}

interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
}

export default function DashboardPage() {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const router = useRouter();
    const { data: users = [], isLoading: usersLoading, error } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.users.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isAdmin,
    });

    const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery<Event[]>({
        queryKey: ['events'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.events.all, { withCredentials: true });
            return res.data;
        },
        enabled: isAuthenticated && isAdmin,
    });


    const queryClient = useQueryClient();

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(routes.users.delete(id), { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: string) => {
            await axiosInstance.delete(routes.events.delete(id), { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });


    useEffect(() => {
        if (!isLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/login');
        }
    }, [isAuthenticated, isAdmin, isLoading, router]);

    if (isLoading || usersLoading || eventsLoading) {
        return <LoadingSpinner />;
    }

    if (error || eventsError) {
        return <div className="text-center mt-8 text-red-500">Failed to load users or events.</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        return null;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <h2 className="text-2xl font-semibold mb-4">All Users:</h2>
            <div className="grid gap-4">
                {users.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="flex flex-row justify-between items-center gap-2">
                            <div className="flex flex-col gap-2">
                                <div className="font-semibold">{user.firstName} {user.lastName}</div>
                                <div>{user.email}</div>
                                <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete {user.name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteUserMutation.mutate(user.id)}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">All Events:</h2>
            <div className="grid gap-4">
                {events.map((event) => (
                    <Card key={event.id}>
                        <CardContent className="flex flex-row justify-between items-center gap-2">
                            <div className="flex flex-col gap-2">
                                <div className="font-semibold">{event.title}</div>
                                <div className="text-gray-600">{event.location}</div>
                                <div className="text-sm text-gray-500">{format(new Date(event.date), 'MM/dd/yyyy')}</div>
                            </div>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete {event.title}? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteEventMutation.mutate(event.id)}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}