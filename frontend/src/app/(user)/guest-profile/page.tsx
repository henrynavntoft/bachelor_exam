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
                        upcomingEvents={data.upcomingEvents}
                        pastEvents={data.pastEvents}
                        isLoadingEvents={data.isLoadingEvents}
                    />
                )}
            </GuestDataProvider>
        </UserProfileView>
    );
} 