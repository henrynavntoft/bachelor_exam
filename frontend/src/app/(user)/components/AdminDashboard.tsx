'use client';

import { User } from '@/lib/types/user';
import { Event } from '@/lib/types/event';
import { UserCard } from '@/app/(user)/components/UserCard';
import { EventCard } from '@/app/(event)/components/EventCard';
import { UserProfileHeader } from './UserProfileHeader';

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
            <div className="p-4 bg-card rounded-lg border">
                {currentUser && (
                    <UserProfileHeader
                        user={currentUser}
                        avatarSize="lg"
                        className="pb-2 border-b"
                    />
                )}
                <p className="text-muted-foreground mt-2">
                    Welcome, {currentUser?.firstName} {currentUser?.lastName}. Manage users and events below.
                </p>
            </div>

            {/* Users Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">All Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(events) ? events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            currentUser={currentUser as User}
                            onDelete={onDeleteEvent}
                            isAdminView={true}
                        />
                    )) : (
                        <p className="text-muted-foreground">No events found or data is loading.</p>
                    )}
                </div>
            </section>
        </article>
    );
} 