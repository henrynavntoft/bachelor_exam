'use client';

import { UserProfileView } from '@/app/(user)/components/UserProfileView';
import { HostDataProvider } from '@/app/(user)/components/HostDataProvider';
import { HostDashboard } from '@/app/(user)/components/HostDashboard';

export default function HostProfilePage() {
    return (
        <UserProfileView>
            <HostDataProvider>
                {(data) => (
                    <HostDashboard
                        currentUser={data.currentUser}
                        events={data.events}
                        isCreating={data.isCreating}
                        selectedEventId={data.selectedEventId}
                        setIsCreating={data.setIsCreating}
                        setSelectedEventId={data.setSelectedEventId}
                        handleCreateSubmit={data.handleCreateSubmit}
                        handleEditSubmit={data.handleEditSubmit}
                        handleDelete={data.handleDelete}
                    />
                )}
            </HostDataProvider>
        </UserProfileView>
    );
} 