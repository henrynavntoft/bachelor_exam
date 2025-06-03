'use client';

import { User } from '@/lib/types/user';
import { Event } from '@/lib/types/event';
import { Role } from '@/lib/types/role';
import { UserCard } from '@/app/(user)/components/UserCard';
import { EventCard } from '@/app/(event)/components/EventCard';
import { UserProfileHeader } from './UserProfileHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Users, 
    Calendar, 
    UserCheck, 
    UserX, 
    TrendingUp, 
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer } from "recharts";
import { useMemo } from 'react';

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
    // Calculate analytics data
    const analytics = useMemo(() => {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => !user.isDeleted).length;
        const deletedUsers = users.filter(user => user.isDeleted).length;
        const totalEvents = events.length;
        const hostCount = users.filter(user => user.role === Role.HOST).length;
        const guestCount = users.filter(user => user.role === Role.GUEST).length;
        const adminCount = users.filter(user => user.role === Role.ADMIN).length;

        // Monthly user registrations (mock data based on creation patterns)
        const monthlyData = [
            { month: "Jan", users: Math.floor(Math.random() * 10) + 5 },
            { month: "Feb", users: Math.floor(Math.random() * 15) + 8 },
            { month: "Mar", users: Math.floor(Math.random() * 20) + 12 },
            { month: "Apr", users: Math.floor(Math.random() * 18) + 10 },
            { month: "May", users: Math.floor(Math.random() * 25) + 15 },
            { month: "Jun", users: Math.floor(Math.random() * 22) + 18 },
        ];

        const roleData = [
            { name: "Guests", value: guestCount, fill: "#3b82f6" },
            { name: "Hosts", value: hostCount, fill: "#10b981" },
            { name: "Admins", value: adminCount, fill: "#f59e0b" },
        ];

        return {
            totalUsers,
            activeUsers,
            deletedUsers,
            totalEvents,
            hostCount,
            guestCount,
            adminCount,
            monthlyData,
            roleData
        };
    }, [users, events]);

    const chartConfig = {
        users: {
            label: "Users",
            color: "hsl(var(--chart-1))",
        },
    } satisfies ChartConfig;

    const pieChartConfig = {
        guests: {
            label: "Guests",
            color: "hsl(var(--chart-1))",
        },
        hosts: {
            label: "Hosts", 
            color: "hsl(var(--chart-2))",
        },
        admins: {
            label: "Admins",
            color: "hsl(var(--chart-3))",
        },
    } satisfies ChartConfig;

    return (
        <div className="space-y-6 md:space-y-8 p-4 md:p-6">
            {/* Admin Header */}
            <Card>
                <CardContent className="p-4 md:p-6">
                    {currentUser && (
                        <UserProfileHeader
                            user={currentUser}
                            avatarSize="lg"
                            className="pb-4 border-b"
                        />
                    )}
                    <div className="flex items-center gap-2 mt-4">
                        <Activity className="h-5 w-5 text-brand" />
                        <p className="text-muted-foreground text-sm md:text-base">
                            Welcome back, {currentUser?.firstName}! Here&apos;s your platform overview.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-brand" />
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="text-xl md:text-2xl font-bold">{analytics.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.activeUsers} active, {analytics.deletedUsers} deleted
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-brand" />
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="text-xl md:text-2xl font-bold">{analytics.totalEvents}</div>
                        <p className="text-xs text-muted-foreground">
                            Events created by hosts
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="text-xl md:text-2xl font-bold text-green-600">{analytics.activeUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently active accounts
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Hosts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-brand" />
                    </CardHeader>
                    <CardContent className="pb-3">
                        <div className="text-xl md:text-2xl font-bold">{analytics.hostCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Event organizers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className=" lg:grid grid-cols-1 lg:grid-cols-2 gap-4 ">
                {/* User Growth Chart */}
                <Card className="mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                            <BarChart3 className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                            User Registrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 md:px-6 pb-4">
                        <ChartContainer config={chartConfig} className="h-[180px] md:h-[200px]">
                            <BarChart data={analytics.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* User Roles Distribution */}
                <Card className="mb-4">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                            <PieChart className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                            User Role Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 md:px-6 pb-4">
                        <ChartContainer config={pieChartConfig} className="h-[180px] md:h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <ChartTooltip 
                                        content={<ChartTooltipContent nameKey="name" />}
                                    />
                                    <Pie
                                        data={analytics.roleData.filter(item => item.value > 0)}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={60}
                                        innerRadius={0}
                                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                                        labelLine={false}
                                        fontSize={12}
                                    >
                                        {analytics.roleData.filter(item => item.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Users Management Section */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <Users className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                        User Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    {Array.isArray(users) && users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {users.map((user) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    onDelete={onDeleteUser}
                                    onReactivate={onReactivateUser}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No users found or data is loading.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Events Management Section */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                        <Calendar className="h-4 md:h-5 w-4 md:w-5 text-brand" />
                        Event Management
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    {Array.isArray(events) && events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    currentUser={currentUser as User}
                                    onDelete={onDeleteEvent}
                                    isAdminView={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No events found or data is loading.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 