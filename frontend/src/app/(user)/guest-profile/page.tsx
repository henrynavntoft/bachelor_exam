'use client';

import { UserProfileView } from '@/app/(user)/components/UserProfileView';
import { GuestDataProvider } from '@/app/(user)/components/GuestDataProvider';
import { GuestDashboard } from '@/app/(user)/components/GuestDashboard';

export default function GuestProfilePage() {
    return (
        <UserProfileView>
            <GuestDataProvider>
                {(data) => (
                    <GuestDashboard
                        currentUser={data.currentUser}
                        rsvpedEvents={data.rsvpedEvents}
                        isLoadingEvents={data.isLoadingEvents}
                    />
                )}
            </GuestDataProvider>
        </UserProfileView>
    );
} 