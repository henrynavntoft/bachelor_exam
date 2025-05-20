'use client';

import { User } from '@/types/user';
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

interface UserCardProps {
    user: User;
    onDelete: (id: string) => void;
    onReactivate?: (id: string) => void;
}

export function UserCard({ user, onDelete, onReactivate }: UserCardProps) {
    return (
        <Card>
            <CardContent className="flex flex-row justify-between items-center gap-2 py-4">
                <div className="flex flex-col gap-2">
                    <div className="font-semibold">{user.firstName} {user.lastName}</div>
                    <div>{user.email}</div>
                    <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                    <div className="text-sm text-muted-foreground">
                        {user.isDeleted ? 'Deleted' : 'Active'}
                    </div>
                </div>

                <div className="flex gap-2">
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