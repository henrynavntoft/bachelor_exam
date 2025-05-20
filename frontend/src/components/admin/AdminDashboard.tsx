'use client';

import { User } from '@/types/user';
import { Event } from '@/types/event';
import { UserCard } from '@/components/users/UserCard';
import { EventCard } from '@/components/events/EventCard';
import Image from 'next/image';

interface AdminDashboardProps {
    currentUser: User | null;
    users: User[];
    events: Event[];
    onDeleteUser: (id: string) => void;
    onDeleteEvent: (id: string) => void;
    onReactivateUser: (id: string) => void;
}

export function AdminDashboard({
    currentUser,
    users,
    events,
    onDeleteUser,
    onDeleteEvent,
    onReactivateUser
}: AdminDashboardProps) {
    return (
        <article className="space-y-6">
            {/* Admin Header */}
            <div className="flex flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg border">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome, {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                </div>
                {currentUser?.profilePicture && (
                    <div className="flex-shrink-0">
                        <Image
                            src={currentUser.profilePicture}
                            alt="Profile Picture"
                            width={64}
                            height={64}
                            className="rounded-full object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Users Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">All Users</h2>
                <div className="grid gap-4">
                    {Array.isArray(users) ? users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onDelete={onDeleteUser}
                            onReactivate={onReactivateUser}
                        />
                    )) : (
                        <p className="text-muted-foreground">No users found or data is loading.</p>
                    )}
                </div>
            </section>

            {/* Events Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">All Events</h2>
                <div className="grid gap-4">
                    {Array.isArray(events) ? events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onDelete={onDeleteEvent}
                            isAdmin
                        />
                    )) : (
                        <p className="text-muted-foreground">No events found or data is loading.</p>
                    )}
                </div>
            </section>
        </article>
    );
} 