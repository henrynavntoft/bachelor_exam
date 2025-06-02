'use client';

import { User } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { UserAvatar } from './UserAvatar';

interface UserCardProps {
    user: User;
    onDelete: (id: string) => void;
    onReactivate?: (id: string) => void;
}

export function UserCard({ user, onDelete, onReactivate }: UserCardProps) {
    return (
        <Card>
            <CardContent className="flex flex-col justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="md" />
                    <div className="flex flex-col">
                        <div className="font-semibold">{user.firstName} {user.lastName}</div>
                        <div>{user.email}</div>
                        <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                        <div className="text-sm text-muted-foreground">
                            {user.isDeleted ? 'Deleted' : 'Active'}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                    {user.isDeleted && onReactivate && (
                        <Button variant="outline" onClick={() => onReactivate(user.id)}>
                            Reactivate
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => onDelete(user.id)}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
} 